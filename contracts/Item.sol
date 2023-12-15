// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Item is
    ERC721,
    IERC2981,
    ERC721Enumerable,
    ERC721URIStorage,
    AccessControl,
    ERC721Burnable
{
    using SafeCast for uint256;

    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint96 public percentageBasisPoints = 500; // 5%
    string private baseURI;

    mapping(uint256 => address) receiver;
    mapping(uint256 => uint256) royaltyPercentage;

    constructor() ERC721("Item", "ITGPT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }


    function safeMint(
        address to,
        uint256 tokenId,
        string memory uri,
        uint64 effectID
    ) public onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _setRoyaltyPercentage(tokenId, percentageBasisPoints);
    }

    function batchMint(address _to, uint64[] memory _effects)
        external
        onlyRole(MINTER_ROLE)
    {
        for (uint32 i = 0; i < _effects.length; i++) {
            uint256 _tokenID = totalSupply() + 1;
            uint64 _effectID = _effects[i];
            safeMint(_to, _tokenID, Strings.toString(_tokenID), _effectID);
        }
    }

    function _setBaseURI(string memory _newBaseURI)
        external
        onlyRole(MINTER_ROLE)
    {
        baseURI = _newBaseURI;
    }

    function _increaseBalance(address account, uint128 value)
        internal
        virtual
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        // TODO: make const uri
        return super.tokenURI(tokenId);
    }

    function burn(uint256 tokenId) public override {
        super.burn(tokenId);
        delete receiver[tokenId];
        delete number_effects[tokenId];
        delete effectsId[tokenId];
        delete royaltyPercentage[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(
            ERC721,
            ERC721Enumerable,
            AccessControl,
            ERC721URIStorage,
            IERC165
        )
        returns (bool)
    {
        if (interfaceId == _INTERFACE_ID_ERC2981) {
            return true;
        }
        return super.supportsInterface(interfaceId);
    }

    function _setReceiver(uint256 _tokenId, address _address) internal {
        receiver[_tokenId] = _address;
    }

    function _setRoyaltyPercentage(uint256 _tokenId, uint256 _royaltyPercentage)
        internal
    {
        royaltyPercentage[_tokenId] = _royaltyPercentage;
    }

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        override(IERC2981)
        returns (address Receiver, uint256 royaltyAmount)
    {
        Receiver = receiver[_tokenId];
        royaltyAmount = (_salePrice * royaltyPercentage[_tokenId]) / 10000;
    }
}
