pragma solidity ^0.4.17;
pragma experimental ABIEncoderV2;

contract Registry {

    function Registry() public
    {
        records.length++;
    }

    struct RegistryRecord {
        address owner;
        uint createdTs;
        string url;
        string hash;
        string recipient;
        bool canUpdate;
        bool canTransfer;
        bool canUnregister;
    }

    // RegistryRecord Lookup Maps
    mapping(string => uint) byUrl;
    function getIndexByUrl(string url) public view returns (uint index){
        index = byUrl[url];
    }
    mapping(address => uint[]) byOwner;
    mapping(string => uint[]) byRecipient;
    
    // Owner Lookup Maps
    mapping(address => string) public ownerDomain;
    function myDomain() public view returns(string domain){return ownerDomain[msg.sender];}
    
    mapping(string => address) domainOwner;
    function getDomainOwner(string url) public view returns(address addr)
    {
        addr = domainOwner[url];
    }

    // RegistryRecords
    RegistryRecord[] public records;
    function recordsLength() public view returns(uint length){length = records.length;}
    
    uint public numRecords;
    uint[] public recycling;
    
    //Note: Require statements such as this do not refund gas, as they do not simulate an execution. Always check state before you invoke functions!
    modifier recordMustExist(string url) {
        //Require the location at url have a record.
        require(byUrl[url] != 0);
        _;
    }
    
    modifier recordMustNotExist(string url) {
        //Require the location at url be empty.
        require(byUrl[url] == 0);
        _;
    }
    
    modifier ownerMustMatch(string url) {
        //Require the owner be the one updating the record.
        require(records[byUrl[url]].owner == msg.sender);
        _;
    }

    // This is the function that actually insert a record. 
    function register(string url, string hash, string recipient, bool canUpdate, bool canTransfer, bool canUnregister) public recordMustNotExist(url) {
        //Owner must be registered.
        require(keccak256(ownerDomain[msg.sender]) != keccak256(""));

        RegistryRecord memory record;
        record.createdTs = now;
        record.owner = msg.sender;
        record.url = url;
        record.hash = hash;
        record.recipient = recipient;
        record.canUpdate = canUpdate;
        record.canTransfer = canTransfer;
        record.canUnregister = canUnregister;
        records.push(record);
        
        uint index = records.length - 1;
        if (index == 0){
            records.push(record);
            index = records.length - 1;
        }
        byUrl[url] = index;
        byOwner[msg.sender].push(index);
        if (keccak256(recipient) != keccak256(""))
            byRecipient[recipient].push(index);
        numRecords++;
    }
    
    function registerOwnerDomain(string ownerDomainUrl) public {
        delete domainOwner[ownerDomain[msg.sender]];
        ownerDomain[msg.sender] = ownerDomainUrl;
        domainOwner[ownerDomainUrl] = msg.sender;
    }

    // Updates the values of the given record.
    function update(string url, string hash) public recordMustExist(url) ownerMustMatch(url) {
        //Require the record be updateable.
        require(records[byUrl[url]].canUpdate == true);
        
        records[byUrl[url]].hash = hash;
    }

    // Unregister a given record
    function unregister(string url) public recordMustExist(url) ownerMustMatch(url){
        uint index = byUrl[url];
        RegistryRecord memory record = records[index];
        
        //Require the record be unregisterable.
        require(record.canUnregister == true);
        
        removeElement(byOwner[record.owner],index);
        if (keccak256(record.recipient) != keccak256(""))
            removeElement(byRecipient[record.recipient],index);
        delete records[index];
        delete byUrl[url];
        numRecords--;
        recycling.push(index);
    }
    
    // Transfer ownership of a given record.
    function transfer(string url, address newOwner) public recordMustExist(url) ownerMustMatch(url){
        uint index = byUrl[url];
        
        //Require the record be transferrable;
        require(records[index].canTransfer == true);
        
        records[index].owner = newOwner;
    }

    // Tells whether a given key is registered.
    function isRegistered(string url) public view returns(bool) 
    {
        return byUrl[url] != 0;
    }

    function getRecord(string url) public view recordMustExist(url) returns(address owner, uint createdTs, string returnUrl, string hash, string recipient, bool canUpdate, bool canTransfer, bool canUnregister) 
    {
        uint index = byUrl[url];
        owner = records[index].owner;
        createdTs = records[index].createdTs;
        returnUrl = records[index].url;
        hash = records[index].hash;
        recipient = records[index].recipient;
        canUpdate = records[index].canUpdate;
        canTransfer = records[index].canTransfer;
        canUnregister = records[index].canUnregister;
    }
    
    function getRecordsFor(string identifier) public view returns(RegistryRecord[] returnedRecords)
    {
        uint[] memory recordIndices = byRecipient[identifier];
        for (uint i = 0;i < recordIndices.length;i++)
            returnedRecords[i] = records[recordIndices[i]];
    }
    
    function getRecordsMadeBy(address addr) public view returns(RegistryRecord[] returnedRecords)
    {
        uint[] memory recordIndices = byOwner[addr];
        for (uint i = 0;i < recordIndices.length;i++)
            returnedRecords[i] = records[recordIndices[i]];
    }

    function removeElement(uint[] storage array, uint element) internal 
    {
        for (uint i = 0;i < array.length;i++)
            if (array[i] == element)
                remove(array,i);
    }
    
    // Remove an element from an array.
    function remove(uint[] storage array, uint index) internal 
    {
        if (index >= array.length) return;
        delete array[index];
        for (uint i = index;i < array.length - 1;i++)
            array[i] = array[i+1];
        array.length--;
    }

}