var cedar = function (instance) {
    var me = {
        instance: instance,
        getRecords: function (recordCallback) {
            return instance.recordsLength().then(function (len) {
                var promise = null;
                for (var i = 1; i < len.toNumber(); i++) {
                    promise = instance.records(i).then(function (record) {
                        if (me.wrapRecord(record).owner.replace(/[0x]+/g, "") != "")
                            recordCallback(me.wrapRecord(record));
                    });
                }
                return promise;
            });
        },
        getRecord: function (url) {
            return instance.getRecord(url).then(me.wrapRecord);
        },
        register: function (record) {
            return instance.register(record.url, record.hash, record.recipient, record.canUpdate, record.canTransfer, record.canUnregister);
        },
        update: function (record) {
            return instance.update(record.url, record.hash);
        },
        transfer: function (record) {
            return instance.transfer(record.url, record.owner);
        },
        unregister: function (record) {
            return instance.unregister(record.url);
        },
        wrapRecord: function (record) {
            return {
                owner: record[0],
                createdTs: record[1].toNumber() * 1000,
                url: record[2],
                hash: record[3],
                recipient: record[4],
                canUpdate: record[5],
                canTransfer: record[6],
                canUnregister: record[7]
            };
        },
        getDomainByOwner: function (owner) {
            return instance.ownerDomain(owner);
        },
        getOwnerByDomain: function (domain) {
            return instance.getDomainOwner(domain);
        },
        registerDomainName: function (domain) {
            return instance.registerOwnerDomain(domain);
        },
        getMyDomain: function () {
            return instance.myDomain();
        }
    };
    return me;
}
