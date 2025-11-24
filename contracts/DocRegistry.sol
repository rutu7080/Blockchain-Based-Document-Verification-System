// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract DocRegistry is AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Doc {
        address issuer;
        string ipfsUri;
        uint256 issuedAt;
        bool revoked;
    }

    mapping(bytes32 => Doc) private docs; // bytes32 as key (IMPORTANT!)

    event DocumentIssued(bytes32 indexed docHash, address indexed issuer, string ipfsUri);
    event DocumentRevoked(bytes32 indexed docHash, address indexed issuer);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
    }

    function issueDocument(bytes32 docHash, string calldata ipfsUri) external onlyRole(ISSUER_ROLE) {
        require(docs[docHash].issuedAt == 0, "Already issued");
        require(bytes(ipfsUri).length > 0, "IPFS URI cannot be empty");
        docs[docHash] = Doc(msg.sender, ipfsUri, block.timestamp, false);
        emit DocumentIssued(docHash, msg.sender, ipfsUri);
    }

    function revokeDocument(bytes32 docHash) external onlyRole(ISSUER_ROLE) {
        require(docs[docHash].issuedAt != 0, "Not issued");
        require(!docs[docHash].revoked, "Already revoked");
        require(docs[docHash].issuer == msg.sender, "Only issuer can revoke");
        docs[docHash].revoked = true;
        emit DocumentRevoked(docHash, msg.sender);
    }

    function getDocument(bytes32 docHash) external view returns (
        address issuer,
        string memory ipfsUri,
        uint256 issuedAt,
        bool revoked
    ) {
        Doc storage d = docs[docHash];
        return (d.issuer, d.ipfsUri, d.issuedAt, d.revoked);
    }

    function grantIssuerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Cannot grant role to zero address");
        _grantRole(ISSUER_ROLE, account);
    }

    function revokeIssuerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Cannot revoke role from zero address");
        _revokeRole(ISSUER_ROLE, account);
    }

    function isAdmin(address account) external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    function isIssuer(address account) external view returns (bool) {
        return hasRole(ISSUER_ROLE, account);
    }

    function hasDocument(bytes32 docHash) external view returns (bool) {
        return docs[docHash].issuedAt != 0;
    }
}
