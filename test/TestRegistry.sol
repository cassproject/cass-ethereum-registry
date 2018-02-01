pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Registry.sol";

contract TestRegistry {
    Registry registry = Registry(DeployedAddresses.Registry());
  
    function testRegisterOwnerDomain() public {
        var url = "http://my.domain";
        registry.registerOwnerDomain(url);

        Assert.equal(registry.getDomainOwner(url), this, "Registration of an owner domain should match.");
    }
    
    function testRegister() public {
        registry.register("http://my.domain/myrecord/all","0x31337","fritz.ray@eduworks.com",true,true,true);
        
        registry.register("http://my.domain/myrecord/cantUpdate","0x31338","fritz.ray@eduworks.com",false,true,true);
        
        registry.register("http://my.domain/myrecord/cantTransfer","0x31339","fritz.ray@eduworks.com",true,false,true);
        
        registry.register("http://my.domain/myrecord/cantUnregister","0x31340","fritz.ray@eduworks.com",true,true,false);
    }
    
    function testFetch() public {
        
    }
}