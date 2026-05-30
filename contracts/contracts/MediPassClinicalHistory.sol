// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MediPassRoles.sol";

/**
 * @title MediPassClinicalHistory
 * @notice Manages verifiable clinical history records for patients on Monad.
 */
contract MediPassClinicalHistory {
    MediPassRoles public immutable roles;

    // Struct for an individual verifiable clinical record (e.g., consultation, lab test, vaccine)
    struct Record {
        address addedBy;
        string ipfsCID;      // encrypted metadata details
        uint256 timestamp;
        string recordType;   // e.g., "Consultation", "Lab Result", "Vaccination", "Prescription"
    }

    // Mapping from patient address to their primary encrypted IPFS CID (overall clinical history overview)
    mapping(address => string) private _clinicalHistories;

    // Mapping from patient address to a timeline of verifiable clinical records
    mapping(address => Record[]) private _patientRecords;

    event ClinicalHistoryUpdated(address indexed patient, string ipfsCID);
    event RecordAdded(address indexed patient, address indexed addedBy, string ipfsCID, string recordType, uint256 timestamp);

    constructor(address rolesContract) {
        require(rolesContract != address(0), "Roles contract required");
        roles = MediPassRoles(rolesContract);
    }

    /**
     * @notice Updates the main clinical history document CID for the caller (patient).
     * @param ipfsCID IPFS CID of the encrypted clinical history document.
     */
    function updateClinicalHistory(string calldata ipfsCID) external {
        require(bytes(ipfsCID).length > 0, "IPFS CID required");
        _clinicalHistories[msg.sender] = ipfsCID;
        emit ClinicalHistoryUpdated(msg.sender, ipfsCID);
    }

    /**
     * @notice Get the main clinical history document CID for a patient.
     */
    function getClinicalHistory(address patient) external view returns (string memory) {
        return _clinicalHistories[patient];
    }

    /**
     * @notice Adds an individual verifiable clinical record to a patient's timeline.
     *         Callable by the patient themselves or by a registered doctor.
     */
    function addRecord(
        address patient,
        string calldata ipfsCID,
        string calldata recordType
    ) external {
        require(patient != address(0), "Invalid patient address");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");
        require(bytes(recordType).length > 0, "Record type required");
        
        // Authorization: caller must be the patient themselves or a registered doctor
        require(
            msg.sender == patient || roles.isDoctor(msg.sender),
            "Not authorized to add records to this patient"
        );

        _patientRecords[patient].push(Record({
            addedBy: msg.sender,
            ipfsCID: ipfsCID,
            timestamp: block.timestamp,
            recordType: recordType
        }));

        emit RecordAdded(patient, msg.sender, ipfsCID, recordType, block.timestamp);
    }

    /**
     * @notice Returns the entire verifiable timeline of records for a patient.
     */
    function getRecords(address patient) external view returns (Record[] memory) {
        return _patientRecords[patient];
    }
}
