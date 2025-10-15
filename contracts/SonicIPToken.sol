// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SonicIPToken
 * @dev ERC721 token for Sonic IP audio recordings
 */
contract SonicIPToken is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapping from token ID to metadata hash
    mapping(uint256 => string) private _audioMetadata;
    
    // Events
    event AudioTokenized(uint256 indexed tokenId, address indexed creator, string metadataURI);

    constructor() ERC721("SonicIPToken", "SONIC") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }

    /**
     * @dev Creates a new token for an audio recording
     * @param to The address that will own the minted token
     * @param metadataURI The IPFS URI for the token metadata
     * @param audioHash The IPFS hash of the audio file
     * @return The ID of the newly minted token
     */
    function mintAudioToken(
        address to,
        string memory metadataURI,
        string memory audioHash
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _audioMetadata[tokenId] = audioHash;
        
        emit AudioTokenized(tokenId, to, metadataURI);
        
        return tokenId;
    }
    
    /**
     * @dev Returns the audio metadata hash for a given token
     * @param tokenId The ID of the token
     * @return The IPFS hash of the audio file
     */
    function getAudioMetadata(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "SonicIPToken: Query for nonexistent token");
        return _audioMetadata[tokenId];
    }

    /**
     * @dev Verifies if an address owns the token for a specific audio hash
     * @param owner The address to check
     * @param audioHash The IPFS hash of the audio file
     * @return True if the address owns a token with the given audio hash
     */
    function verifyOwnership(address owner, string memory audioHash) public view returns (bool) {
        uint256 balance = balanceOf(owner);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            if (keccak256(bytes(_audioMetadata[tokenId])) == keccak256(bytes(audioHash))) {
                return true;
            }
        }
        return false;
    }

    // Function to support enumeration
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < balanceOf(owner), "SonicIPToken: owner index out of bounds");
        uint256 count = 0;
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                if (count == index) return i;
                count++;
            }
        }
        revert("SonicIPToken: owner index out of bounds");
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
}