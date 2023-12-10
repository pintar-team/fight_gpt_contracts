// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "@rarible/contracts/impl/RoyaltiesV2Impl.sol";
import "@rarible/contracts/LibPart.sol";
import "@rarible/contracts/LibRoyaltiesV2.sol";

contract HeroesGPT is ERC721, RoyaltiesV2Impl, ERC721Enumerable, ERC721URIStorage, AccessControl, ERC721Burnable {
    using SafeCast for uint256;

    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint96 public percentageBasisPoints = 500;
    string private baseURI;

    constructor() ERC721("HeroesGPT", "HFGPT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function safeMint(address to, uint256 tokenId, string memory uri) public onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        setRoyalties(tokenId, payable(tx.origin), percentageBasisPoints);
    }

    function batchMint(address _to, uint256 _start, uint256 _amount) external onlyRole(MINTER_ROLE) {
        for(uint8 i = 1; i <= _amount; i += 1) {
            uint32 _tokenID = (_start + i).toUint32();
            safeMint(_to, _tokenID, Strings.toString(_start + i));
        }
    }

    function _setBaseURI(string memory _newBaseURI) external onlyRole(MINTER_ROLE) {
        baseURI = _newBaseURI;
    }
    
    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        safeTransferFrom(msg.sender, address(this), tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function setRoyalties(uint _tokenId, address payable _royaltiesReceipientAddress, uint96 _percentageBasisPoints) internal onlyRole(MINTER_ROLE) {
        LibPart.Part[] memory _royalties = new LibPart.Part[](1);
        _royalties[0].value = _percentageBasisPoints;
        _royalties[0].account = _royaltiesReceipientAddress;
        _saveRoyalties(_tokenId, _royalties);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        if(interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES) {
            return true;
        }
        if(interfaceId == _INTERFACE_ID_ERC2981){
          return true;
        }
        return super.supportsInterface(interfaceId);
    }

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view returns (address receiver, uint256 royaltyAmount){
      LibPart.Part[] memory _royalties = royalties[_tokenId];
      if(_royalties.length > 0){
        return (_royalties[0].account, (_salePrice * _royalties[0].value) / 10000);
      }
      return (address(0), 0);
    }
}
