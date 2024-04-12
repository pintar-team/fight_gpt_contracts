// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

contract WaitList {
    uint256[5] public waiting;
    uint256 public count = 0;

    function get(uint256 _value) public view returns (uint256) {
        return waiting[_value];
    }

    function has(uint256 _id) public view returns (bool) {
        for (uint8 i = 0; i < waiting.length; i++) {
            if (waiting[i] == _id) {
                return true;
            }
        }

        return false;
    }

    function hasEmpty() public view returns (bool) {
        for (uint8 i = 0; i < waiting.length; i++) {
            if (waiting[i] != 0) {
                return false;
            }
        }

        return true;
    }

    function hasSpace() public view returns (bool) {
        for (uint8 i = 0; i < waiting.length; i++) {
            if (waiting[i] == 0) {
                return true;
            }
        }

        return false;
    }

    function add(uint256 _value) internal {
        require(count < waiting.length, "WaitList is full");
        for (uint256 i = 0; i < count; i++) {
            require(waiting[i] != _value, "Element already exists");
        }
        waiting[count] = _value;
        count++;
    }

    function remove_w(uint256 _value) internal {
        require(count > 0, "WaitList is empty");
        bool found = false;

        for (uint256 i = 0; i < count; i++) {
            if (waiting[i] == _value) {
                found = true;
                for (uint256 j = i; j < count - 1; j++) {
                    waiting[j] = waiting[j + 1];
                }
                break;
            }
        }

        require(found, "Element not found");

        waiting[count - 1] = 0;
        count--;
    }

    function pop() internal returns (uint256) {
        require(count > 0, "WaitList is empty");
        uint256 value = waiting[0];
        for (uint8 i = 1; i < count; i++) {
            waiting[i - 1] = waiting[i];
        }
        waiting[count - 1] = 0;
        count--;
        return value;
    }
}
