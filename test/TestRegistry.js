// Specifically request an abstraction for MetaCoin
var Registry = artifacts.require("Registry");

contract('Registry', function (accounts) {
    it("Should allow registration of an owner domain, domain owner and owner domain should match.", function () {
        var myDomain = "http://my.domain";
        return Registry.deployed().then(function (instance) {
            instance.registerOwnerDomain(myDomain);
            return instance;
        }).then(function (instance) {
            return instance.getDomainOwner(myDomain).then(function (owner) {
                assert.equal(owner, accounts[0], "Domain owner does not match first account.");
                console.log("Domain owner matches.");
                return instance;
            });
        }).then(function (instance) {
            return instance.ownerDomain(accounts[0]).then(function (domain) {
                assert.equal(domain, myDomain, "Domain for owner does not match.");
                console.log("Owner domain matches.");
                return instance;
            });
        });
    });
    it("Should allow for records to be registered and retrieved.", function () {
        return Registry.deployed().then(function (instance) {
            return instance.register("http://my.domain/myrecord/all", "0x31337", "fritz.ray@eduworks.com", true, true, true).then(function () {
                console.log("Creating record 1.");
                return instance;
            });
        }).then(function (instance) {
            console.log("Fetching record 1.");
            return instance.getRecord("http://my.domain/myrecord/all").then(function (record) {
                console.log(record);
                assert.equal(record[0], accounts[0], "Owner for record does not match.");
                assert.notEqual(record[1], 0, "Created timestamp is not default.");
                assert.equal(record[2], "http://my.domain/myrecord/all", "Url does not match.");
                assert.equal(record[3], "0x31337", "Hash does not match.");
                assert.equal(record[4], "fritz.ray@eduworks.com", "Recipient does not match.");
                assert.equal(record[5], true, "canUpdate does not match.");
                assert.equal(record[6], true, "canTransfer does not match.");
                assert.equal(record[7], true, "canUnregister does not match.");
                console.log("First record matches.");
                return instance;
            });
        }).then(function (instance) {
            return instance.register("http://my.domain/myrecord/cantUpdate", "0x31338", "fritz.ray@eduworks.com", false, true, true).then(function () {
                console.log("Creating record 2.");
                return instance;
            });
        }).then(function (instance) {
            console.log("Fetching record 2.");
            return instance.getRecord("http://my.domain/myrecord/cantUpdate").then(function (record) {
                console.log(record);
                assert.equal(record[0], accounts[0], "Owner for record does not match.");
                assert.notEqual(record[1], 0, "Created timestamp is not default.");
                assert.equal(record[2], "http://my.domain/myrecord/cantUpdate", "Url does not match.");
                assert.equal(record[3], "0x31338", "Hash does not match.");
                assert.equal(record[4], "fritz.ray@eduworks.com", "Recipient does not match.");
                assert.equal(record[5], false, "canUpdate does not match.");
                assert.equal(record[6], true, "canTransfer does not match.");
                assert.equal(record[7], true, "canUnregister does not match.");
                console.log("Second record matches.");
                return instance;
            });
        }).then(function (instance) {
            return instance.register("http://my.domain/myrecord/cantTransfer", "0x31339", "fritz.ray@eduworks.com", true, false, true).then(function () {
                console.log("Creating record 3.");
                return instance;
            });
        }).then(function (instance) {
            console.log("Fetching record 3.");
            return instance.getRecord("http://my.domain/myrecord/cantTransfer").then(function (record) {
                console.log(record);
                assert.equal(record[0], accounts[0], "Owner for record does not match.");
                assert.notEqual(record[1], 0, "Created timestamp is not default.");
                assert.equal(record[2], "http://my.domain/myrecord/cantTransfer", "Url does not match.");
                assert.equal(record[3], "0x31339", "Hash does not match.");
                assert.equal(record[4], "fritz.ray@eduworks.com", "Recipient does not match.");
                assert.equal(record[5], true, "canUpdate does not match.");
                assert.equal(record[6], false, "canTransfer does not match.");
                assert.equal(record[7], true, "canUnregister does not match.");
                console.log("Third record matches.");
                return instance;
            });
        }).then(function (instance) {
            return instance.register("http://my.domain/myrecord/cantUnregister", "0x31340", "fritz.ray@eduworks.com", true, true, false).then(function () {
                console.log("Creating record 4.");
                return instance;
            });
        }).then(function (instance) {
            console.log("Fetching record 4.");
            return instance.getRecord("http://my.domain/myrecord/cantUnregister").then(function (record) {
                console.log(record);
                assert.equal(record[0], accounts[0], "Owner for record does not match.");
                assert.notEqual(record[1], 0, "Created timestamp is not default.");
                assert.equal(record[2], "http://my.domain/myrecord/cantUnregister", "Url does not match.");
                assert.equal(record[3], "0x31340", "Hash does not match.");
                assert.equal(record[4], "fritz.ray@eduworks.com", "Recipient does not match.");
                assert.equal(record[5], true, "canUpdate does not match.");
                assert.equal(record[6], true, "canTransfer does not match.");
                assert.equal(record[7], false, "canUnregister does not match.");
                console.log("Fourth record matches.");
                return instance;
            });
        });
    });
    it("Should not allow recreation of an existing record.", function () {
        return Registry.deployed().then(function (instance) {
            instance.getIndexByUrl("http://my.domain/myrecord/cantUnregister").then(function (index) {
                console.log(index);
            });
            return instance.register("http://my.domain/myrecord/cantUnregister", "0x314038", "not_fritz@eduworks.com", true, true, false).then(function () {
                console.log("Creating record 4 again.");
                return instance;
            });;
        }).then(function (instance) {
            console.log("Fetching record 4.");
            return instance.getRecord("http://my.domain/myrecord/cantUnregister").then(function (record) {
                console.log(record);
                assert.equal(record[0], accounts[0], "Owner for record does not match.");
                assert.notEqual(record[1], 0, "Created timestamp is not default.");
                assert.equal(record[2], "http://my.domain/myrecord/cantUnregister", "Url does not match.");
                assert.equal(record[3], "0x31340", "Hash does not match.");
                assert.equal(record[4], "fritz.ray@eduworks.com", "Recipient does not match.");
                assert.equal(record[5], true, "canUpdate does not match.");
                assert.equal(record[6], true, "canTransfer does not match.");
                assert.equal(record[7], false, "canUnregister does not match.");
                console.log("Fourth record is unchanged.");
                return instance;
            });
        });
    });
});
