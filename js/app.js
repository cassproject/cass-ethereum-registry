App = {
    web3Provider: null,
    contracts: {},

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        return App.initContract();
    },

    initContract: function () {
        $.getJSON('build/contracts/Registry.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var RegistryArtifact = data;
            App.contracts.Registry = TruffleContract(RegistryArtifact);

            // Set the provider for our contract
            App.contracts.Registry.setProvider(App.web3Provider);

            // Use our contract to retrieve and mark the adopted pets
            App.updateWeb3Data();
            // Use our contract to retrieve and mark the adopted pets
            return App.downloadRecords();
        });

        return App.bindEvents();
    },

    invl: null,
    lastAgent: null,
    recipientLookup: {},
    bindEvents: function () {
        $(document).on('click', '.btn-new', App.handleNew);
        $(document).on('click', '.btn-update', App.handleUpdate);
        $(document).on('click', '.btn-transfer', App.handleTransfer);
        $(document).on('click', '.btn-unregister', App.handleUnregister);
        $(document).on('click', '.btn-registerDomain', function () {
            $("#registerDomain").show();
        });
        $(document).on('click', '.btn-add', function () {
            $("#newRecord").show();
        });
        $('.btn-downloadSignature')[0].href = "data:text/plain," + App.web3Provider.publicConfigStore._state.selectedAddress;
        $('.btn-downloadSignature')[0].download = "cedar.eth";
        $(document).on('keyup', '.registerDomain-url', App.refreshDomainNameRegistration);
        $(document).on('keyup', '.transferRecord-url', App.refreshTransferRecord);
        $(document).on('keyup', '.transferRecord-address', App.refreshTransferRecord);

        $(document).on('click', '.btn-transferRecord', App.finishTransferRecord);
        $(document).on('click', '.btn-checkAddRecord', App.refreshRegister);
        $(document).on('click', '.btn-registerDomainName', App.registerDomainName);
        var foo = function () {
            $(".btn-addRecord").attr("disabled", true);
            $(".btn-addRecord-error").addClass("error").text("Data has changed. Check again when ready.");
            App.candidateRecord = null;
        };
        $(document).on('keyup', '.addRecord-url', foo);
        $(document).on('keyup', '.addRecord-recipient', foo);
        $(document).on('change', '.addRecord-canUpdate', foo);
        $(document).on('change', '.addRecord-canTransfer', foo);
        $(document).on('change', '.addRecord-canUnregister', foo);
        $(document).on('click', '.btn-addRecord', App.registerCandidateRecord);
        $(document).on('click', '.btn-identify', function () {
            var recipient = prompt("Please enter the identifier.");
            return App.contracts.Registry.deployed().then(function (instance) {
                var hash = sha256.digest(recipient + instance.address);
                App.recipientLookup[b64EncodeBuffer(hash)] = recipient;
                App.downloadRecords();
            });
        });
    },

    finishTransferRecord: function () {

        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            return registry.transfer(App.transferRecord).then(function () {
                App.downloadRecords();
                App.refreshTransferRecord();
                App.transferRecord = null;
                $("#transferRecord").hide();
            });
        });
    },
    refreshTransferRecord: function () {

        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            $(".btn-transferRecord").attr("disabled", true);
            $(".transferRecord-address").val("");
            try {
                new URL($(".transferRecord-url").val());
            } catch (e) {
                $(".btn-transferRecord-error").addClass("error").text("Not a valid URL.");
                return;
            }
            $(".btn-transferRecord-error").addClass("error").text("Checking registration...");
            var url = new URL("cedar.eth", $(".transferRecord-url").val()).toString();
            registry.getOwnerByDomain($(".transferRecord-url").val()).then(function (owner) {
                $(".transferRecord-address").val(owner);
                if (owner == App.web3Provider.publicConfigStore._state.selectedAddress) {
                    $(".btn-transferRecord-error").addClass("error").text("Domain is registered but " + url + " does not exist or is not accessible (check CORS).");
                    App.get(url, function (result, b, response) {
                        if (result.trim().toLowerCase() == App.web3Provider.publicConfigStore._state.selectedAddress)
                            $(".btn-transferRecord-error").addClass("error").text("Domain is registered to you. Binding file is OK.");
                        else
                            $(".btn-transferRecord-error").addClass("error").text("Domain is registered to you but " + url + " is showing the wrong address.");
                    });
                } else if (owner.replace(/[0x]+/g, "") == "") {
                    $(".btn-transferRecord-error").addClass("error").text("Domain is not registered.");
                } else {
                    $(".btn-transferRecord-error").addClass("error").text("Domain is registered but " + url + " does not exist or is not accessible (check CORS).");
                    App.get(url, function (result, b, response) {
                        if (result.trim().toLowerCase() == owner) {
                            $(".btn-transferRecord-error").removeClass("error").text("Domain is registered. Binding file found.");
                            $(".btn-transferRecord").attr("disabled", null);
                            App.transferRecord.owner = owner;
                        } else
                            $(".btn-transferRecord-error").addClass("error").text("Domain is registered but " + url + " is showing the wrong address.");
                    });
                }
            });
        });
    },
    updateWeb3Data: function () {
        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            registry.getMyDomain().then(function (domain) {
                if (domain != "") {
                    $(".registerDomain-url").val(domain);
                    $(".addRecord-agent").val(domain);
                    $(".btn-add").attr("disabled", null);
                    $(".btn-registerDomain-error").removeClass("error").text("Domain is registered to you.");
                    App.refreshDomainNameRegistration();
                } else {
                    $(".addRecord-agent").val("This Ethereum address is not bound to a domain. Please register a domain name.");
                    $(".btn-add").attr("disabled", "true");
                }
            });
        });
    },

    downloadRecords: function () {
        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            $('#records').html("");
            return registry.getRecords(function (record) {
                var recordsRow = $('#records');
                var recordDiv = recordsRow.prepend($('#recordTemplate').html()).children().first();
                recordDiv.find('.record-timestamp').text("Registered " + new Date(record.createdTs).toLocaleString());
                recordDiv.find('.record-agent').text(record.recipient);
                App.lookupAgent(record, recordDiv.find('.record-agent'));
                recordDiv.find('.record-recipient').text("").text("Finding...");
                App.lookupRecipient(record, recordDiv.find('.record-recipient'));
                recordDiv.find('.record-url').attr("href", record.url);
                recordDiv.find('.record-integrity').text("Determining...");
                App.determineIntegrity(record, recordDiv.find('.record-integrity'));
                if (!record.canUpdate || record.owner != App.web3Provider.publicConfigStore._state.selectedAddress)
                    recordDiv.find('.btn-update').hide();
                if (!record.canTransfer || record.owner != App.web3Provider.publicConfigStore._state.selectedAddress)
                    recordDiv.find('.btn-transfer').hide();
                if (!record.canUnregister || record.owner != App.web3Provider.publicConfigStore._state.selectedAddress)
                    recordDiv.find('.btn-unregister').hide();
                App.get(record.url, function (result, b, request) {
                    var result = JSON.parse(result);
                    var type = result["@type"];
                    if (type === undefined)
                        type = result.type;
                    recordDiv.find('.record-url').text(type);
                    //recordDiv.find('img').attr('src', data[i].picture);
                });
            });
        }).catch(function (err) {
            console.log(err.message);
        });
    },
    lookupAgent: function (record, div) {
        var registry;

        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            registry.getDomainByOwner(record.owner).then(function (domain) {
                div.text(domain);
            });
        });
    },
    lookupRecipient: function (record, div) {
        if (App.recipientLookup[record.recipient] != null)
            div.text(App.recipientLookup[record.recipient]);
        else
            div.text(record.recipient);
    },
    determineIntegrity: function (record, div) {
        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            registry.getDomainByOwner(record.owner).then(function (domain) {
                var domainUrl = new URL("cedar.eth", domain);
                div.addClass("error").text("Domain binding not reachable.");
                App.get(domainUrl, function (result, b, response) {
                    if (result.trim().toLowerCase() != record.owner) {
                        div.addClass("error").text("Domain binding not for the owner of this record.");
                        return;
                    }
                    div.addClass("error").text("Record not reachable.");
                    App.get(record.url, function (result, b, response) {
                        var buffer = new TextEncoder("utf-8").encode(result);
                        var hash = sha256.digest(result);
                        if (b64EncodeBuffer(hash) != record.hash) {
                            div.addClass("error").text("Record has been modified since it was registered.");
                            return;
                        } else
                            div.removeClass("error").text("OK.");
                    });
                });
            });
        });
    },
    candidateRecord: null,
    handleUpdate: function (event) {
        event.preventDefault();
        event.stopPropagation();
        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            var url = $(event.target).parents(".col-record").find(".record-url").attr("href");
            registry.getRecord(url).then(function (record) {
                if (record.canUpdate)
                    App.get(record.url, function (result, b, response) {
                        var hash = sha256.digest(result);
                        if (b64EncodeBuffer(hash) != record.hash) {
                            record = JSON.parse(JSON.stringify(record));
                            record.hash = b64EncodeBuffer(hash);
                            registry.update(record);
                        } else
                            alert("Hashes already match. Nothing to do.");
                    });
            });
        });
    },
    transferRecord: null,
    handleTransfer: function (event) {
        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            var url = $(event.target).parents(".col-record").find(".record-url").attr("href");
            registry.getRecord(url).then(function (record) {
                if (record.canTransfer) {
                    App.transferRecord = record;
                    $("#transferRecord").show();
                }
            });
        });

    },
    handleUnregister: function (event) {
        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            var url = $(event.target).parents(".col-record").find(".record-url").attr("href");
            registry.getRecord(url).then(function (record) {
                if (record.canUnregister)
                    registry.unregister(record).then(App.downloadRecords());
            });
        });

    },
    registerCandidateRecord: function () {
        $(".btn-addRecord").attr("disabled", true);
        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            $(".btn-addRecord-error").removeClass("error").text("Registering Record...");
            return registry.register(App.candidateRecord).then(function () {
                App.invl = setInterval(function () {
                    registry.getRecord($(".addRecord-url").val()).then(function (record) {
                        $(".btn-addRecord-error").removeClass("error").text("Record is registered.");
                        clearInterval(App.invl);
                        App.downloadRecords();
                        $("#newRecord").hide();
                    });
                }, 1000);
            });
        });
    },
    refreshRegister: function () {
        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            $(".btn-addRecord").attr("disabled", true);
            try {
                new URL($(".addRecord-url").val());
            } catch (e) {
                $(".btn-addRecord-error").addClass("error").text("Not a valid URL.");
                return;
            }
            var url = new URL($(".addRecord-url").val()).toString();
            registry.getRecord($(".addRecord-url").val()).then(
                function (record) {
                    $(".btn-addRecord-error").addClass("error").text("Record is already registered.");
                },
                function (record) {
                    console.log(record);
                    $(".btn-addRecord-error").addClass("error").text("Retrieving record. If this takes too long, the URL may not have CORS headers appropriately set.");
                    App.get(url, function (result, b, response) {
                        var hash = sha256.digest(result);
                        var recipient = sha256.digest($(".addRecord-recipient").val() + instance.address);
                        $(".addRecord-hash").val(b64EncodeBuffer(hash));
                        var record = {
                            url: url,
                            hash: b64EncodeBuffer(hash),
                            recipient: $(".addRecord-recipient").val() == "" ? "Not disclosed." : b64EncodeBuffer(recipient),
                            canUpdate: $(".addRecord-canUpdate").is(":checked"),
                            canTransfer: $(".addRecord-canTransfer").is(":checked"),
                            canUnregister: $(".addRecord-canUnregister").is(":checked")
                        };
                        App.recipientLookup[b64EncodeBuffer(recipient)] = $(".addRecord-recipient").val();
                        App.candidateRecord = record;
                        $(".btn-addRecord-error").removeClass("error").text("Ready to register.");
                        $(".btn-addRecord").attr("disabled", null);
                    });

                });
        });
    },
    registerDomainName: function () {
        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            registry.registerDomainName($(".registerDomain-url").val()).then(function () {
                App.lastAgent = $(".addRecord-agent").val();
                App.invl = setInterval(function () {
                    App.refreshDomainNameRegistration();
                    App.updateWeb3Data();
                    if ($(".addRecord-agent").val() != App.lastAgent) {
                        clearInterval(App.invl);
                        $("#registerDomain").hide();
                    }
                    lastAgent = $(".addRecord-agent").val();
                }, 1000);
            });
        });
    },
    refreshDomainNameRegistration: function () {
        var registry;
        return App.contracts.Registry.deployed().then(function (instance) {
            registry = cedar(instance);
            $(".btn-registerDomainName").attr("disabled", true);
            try {
                new URL($(".registerDomain-url").val());
            } catch (e) {
                $(".btn-registerDomain-error").addClass("error").text("Not a valid URL.");
                return;
            }
            $(".btn-registerDomain-error").addClass("error").text("Checking registration...");
            var url = new URL("cedar.eth", $(".registerDomain-url").val()).toString();
            registry.getOwnerByDomain($(".registerDomain-url").val()).then(function (domain) {
                if (domain == App.web3Provider.publicConfigStore._state.selectedAddress) {
                    $(".btn-registerDomain-error").addClass("error").text("Domain is registered to you but " + url + " does not exist or is not accessible (check CORS).");
                    App.get(url, function (result, b, response) {
                        if (result.trim().toLowerCase() == App.web3Provider.publicConfigStore._state.selectedAddress)
                            $(".btn-registerDomain-error").removeClass("error").text("Domain is registered to you. Binding file is OK.");
                        else
                            $(".btn-registerDomain-error").addClass("error").text("Domain is registered to you but " + url + " is showing the wrong address.");
                    });
                } else if (domain.replace(/[0x]+/g, "") == "") {
                    $(".btn-registerDomain-error").addClass("error").text("Domain is available to register but " + url + " does not exist or is not accessible (check CORS).");
                    App.get(url, function (result, b, response) {
                        if (result.trim().toLowerCase() == App.web3Provider.publicConfigStore._state.selectedAddress)
                            $(".btn-registerDomain-error").removeClass("error").text("Domain is available to register. Binding file found.");
                        else
                            $(".btn-registerDomain-error").addClass("error").text("Domain is available to register but " + url + " is showing the wrong address.");
                    });
                    $(".btn-registerDomainName").attr("disabled", null);
                } else {
                    $(".btn-registerDomain-error").addClass("error").text("Domain is already taken.");
                }
            });
        });
    },
    getCache: {},
    get: function (url, success, type) {
        if (typeof App.getCache[url] == "number") {
            if (App.getCache[url] >= 0) {
                App.getCache[url]--;
                setTimeout(function () {
                    App.get(url, success);
                }, 100);
            }
            return;
        } else if (App.getCache[url] != null)
            success(App.getCache[url], 200, null);
        App.getCache[url] = 300;
        $.get(url, function (a, b, c) {
            App.getCache[url] = a;
            success(a, b, c);
        }, (type == null || type === undefined) ? "text" : type);
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});

var downloadFile = function (filename, content) {
    var blob = new Blob([content]);
    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(blob);
    hyperlink.download = filename;

    hyperlink.style = 'display:none;opacity:0;color:transparent;';
    (document.body || document.documentElement).appendChild(hyperlink);

    if (typeof hyperlink.click === 'function') {
        hyperlink.click();
    } else {
        hyperlink.target = '_blank';
        hyperlink.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        }));
    }

    (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
};

function hex(buffer) {
    var hexCodes = [];
    var view = new DataView(buffer);
    for (var i = 0; i < view.byteLength; i += 4) {
        // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
        var value = view.getUint32(i)
        // toString(16) will give the hex representation of the number without padding
        var stringValue = value.toString(16)
        // We use concatenation and slice for padding
        var padding = '00000000'
        var paddedValue = (padding + stringValue).slice(-padding.length)
        hexCodes.push(paddedValue);
    }

    // Join all the hex strings into one
    return hexCodes.join("");
}

function b64EncodeBuffer(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
