// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./MediPassRoles.sol";

/**
 * @title MediPassPrescription
 * @notice Soulbound (non-transferable) ERC-721 representing medical prescriptions
 *         on the MediPass platform. Each token encodes a prescription linked to
 *         an IPFS metadata record.
 *
 * Soulbound: tokens can only be minted or burned — lateral transfers are reverted.
 */
contract MediPassPrescription is ERC721 {
    // ─── State ────────────────────────────────────────────────────────────────

    MediPassRoles public immutable roles;

    uint256 private _nextTokenId = 1;

    // ─── Data Structures ─────────────────────────────────────────────────────

    struct Prescription {
        uint256 tokenId;
        address patient;
        address doctor;
        string  ipfsCID;
        string  medicationName;
        uint256 dosageMg;
        uint256 refillsAllowed;
        uint256 refillsUsed;
        bool    isActive;
        bool    isDispensed;
        uint256 issuedAt;
        uint256 expiresAt;
    }

    mapping(uint256 => Prescription) private _prescriptions;
    mapping(address  => uint256[])   private _patientPrescriptions;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PrescriptionIssued(
        uint256 indexed tokenId,
        address indexed patient,
        address indexed doctor,
        string  medicationName,
        uint256 expiresAt
    );

    event PrescriptionDispensed(
        uint256 indexed tokenId,
        address indexed pharmacist,
        uint256 refillsUsed,
        uint256 refillsAllowed
    );

    event PrescriptionRevoked(
        uint256 indexed tokenId,
        address indexed revokedBy
    );

    // ─── Errors ───────────────────────────────────────────────────────────────

    error NotAuthorized(string reason);
    error PrescriptionNotActive(uint256 tokenId);
    error PrescriptionExpired(uint256 tokenId);
    error NoRefillsRemaining(uint256 tokenId);
    error SoulboundTransferNotAllowed();

    // ─── Constructor ─────────────────────────────────────────────────────────

    /**
     * @param rolesContract Address of the deployed MediPassRoles contract.
     */
    constructor(address rolesContract) ERC721("MediPass Prescription", "MPRX") {
        require(rolesContract != address(0), "Roles contract required");
        roles = MediPassRoles(rolesContract);
    }

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyDoctor() {
        if (!roles.isDoctor(msg.sender))
            revert NotAuthorized("Caller is not a doctor");
        _;
    }

    modifier onlyPharmacist() {
        if (!roles.isPharmacist(msg.sender))
            revert NotAuthorized("Caller is not a pharmacist");
        _;
    }

    modifier onlyDoctorOrAdmin() {
        if (!roles.isDoctor(msg.sender) && !roles.isAdmin(msg.sender))
            revert NotAuthorized("Caller is not a doctor or admin");
        _;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Issue a new prescription as a soulbound NFT.
     * @param patient        Recipient patient address.
     * @param ipfsCID        IPFS CID pointing to full prescription metadata.
     * @param medicationName Human-readable medication name.
     * @param dosageMg       Dosage in milligrams.
     * @param refillsAllowed Number of allowed refills (0 = no refills).
     * @param expiresAt      Unix timestamp when the prescription expires.
     * @return tokenId       The newly minted token ID.
     */
    function issuePrescription(
        address patient,
        string  calldata ipfsCID,
        string  calldata medicationName,
        uint256 dosageMg,
        uint256 refillsAllowed,
        uint256 expiresAt
    ) external onlyDoctor returns (uint256 tokenId) {
        require(patient != address(0),      "Invalid patient address");
        require(bytes(ipfsCID).length > 0,  "IPFS CID required");
        require(bytes(medicationName).length > 0, "Medication name required");
        require(expiresAt > block.timestamp, "Expiry must be in the future");

        tokenId = _nextTokenId++;

        _prescriptions[tokenId] = Prescription({
            tokenId:        tokenId,
            patient:        patient,
            doctor:         msg.sender,
            ipfsCID:        ipfsCID,
            medicationName: medicationName,
            dosageMg:       dosageMg,
            refillsAllowed: refillsAllowed,
            refillsUsed:    0,
            isActive:       true,
            isDispensed:    false,
            issuedAt:       block.timestamp,
            expiresAt:      expiresAt
        });

        _patientPrescriptions[patient].push(tokenId);

        // Mint soulbound token to patient
        _safeMint(patient, tokenId);

        emit PrescriptionIssued(tokenId, patient, msg.sender, medicationName, expiresAt);
    }

    /**
     * @notice Dispense a prescription. Handles refills if allowed.
     * @param tokenId The prescription token to dispense.
     */
    function dispensePrescription(uint256 tokenId) external onlyPharmacist {
        Prescription storage rx = _prescriptions[tokenId];

        if (!rx.isActive)
            revert PrescriptionNotActive(tokenId);

        if (block.timestamp > rx.expiresAt)
            revert PrescriptionExpired(tokenId);

        if (rx.isDispensed) {
            // Already dispensed at least once — check refills
            if (rx.refillsUsed >= rx.refillsAllowed)
                revert NoRefillsRemaining(tokenId);
            rx.refillsUsed++;
        } else {
            rx.isDispensed = true;
        }

        emit PrescriptionDispensed(tokenId, msg.sender, rx.refillsUsed, rx.refillsAllowed);
    }

    /**
     * @notice Revoke (deactivate) a prescription.
     * @param tokenId The prescription token to revoke.
     */
    function revokePrescription(uint256 tokenId) external onlyDoctorOrAdmin {
        Prescription storage rx = _prescriptions[tokenId];

        if (!rx.isActive)
            revert PrescriptionNotActive(tokenId);

        rx.isActive = false;

        emit PrescriptionRevoked(tokenId, msg.sender);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Get all prescription token IDs belonging to a patient.
     * @param patient Patient address.
     * @return Array of token IDs.
     */
    function getPatientPrescriptions(address patient)
        external
        view
        returns (uint256[] memory)
    {
        return _patientPrescriptions[patient];
    }

    /**
     * @notice Retrieve full prescription data for a given token ID.
     * @param tokenId The token ID to query.
     * @return The Prescription struct.
     */
    function getPrescription(uint256 tokenId)
        external
        view
        returns (Prescription memory)
    {
        require(_prescriptions[tokenId].issuedAt != 0, "Prescription does not exist");
        return _prescriptions[tokenId];
    }

    // ─── Soulbound Override ───────────────────────────────────────────────────

    /**
     * @dev Override ERC721's _update to prevent all transfers except mint (from==0)
     *      and burn (to==0).
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow mint (from == address(0)) and burn (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferNotAllowed();
        }

        return super._update(to, tokenId, auth);
    }

    // ─── Metadata ─────────────────────────────────────────────────────────────

    /**
     * @notice Returns token URI pointing to IPFS metadata.
     * @param tokenId The token to query.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_prescriptions[tokenId].issuedAt != 0, "Token does not exist");
        return string(abi.encodePacked("ipfs://", _prescriptions[tokenId].ipfsCID));
    }
}
