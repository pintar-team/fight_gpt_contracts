// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;


contract WaitList {
    uint256[5] public waiting;
    uint256 public count = 0;

    function add(uint256 _value) public {
        require(count < waiting.length, "WaitList is full");
        for(uint i = 0; i < count; i++) {
            require(waiting[i] != _value, "Element already exists");
        }
        waiting[count] = _value;
        count++;
    }

    function pop() public returns (uint256) {
        require(count > 0, "WaitList is empty");
        uint256 value = waiting[0];
        for(uint i = 1; i < count; i++) {
            waiting[i - 1] = waiting[i];
        }
        waiting[count - 1] = 0;
        count--;
        return value;
    }
}
