// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MediPassRoles
 * @notice Manages role-based access control for the MediPass platform.
 *         Roles: ADMIN, DOCTOR, PHARMACIST, PATIENT
 */
contract MediPassRoles is AccessControl {
    // ─── Role Identifiers ────────────────────────────────────────────────────
    bytes32 public constant ADMIN_ROLE       = keccak256("ADMIN_ROLE");
    bytes32 public constant DOCTOR_ROLE      = keccak256("DOCTOR_ROLE");
    bytes32 public constant PHARMACIST_ROLE  = keccak256("PHARMACIST_ROLE");
    bytes32 public constant PATIENT_ROLE     = keccak256("PATIENT_ROLE");

    // ─── Member Tracking ─────────────────────────────────────────────────────
    address[] private _doctors;
    address[] private _pharmacists;

    mapping(address => uint256) private _doctorIndex;       // 1-based index
    mapping(address => uint256) private _pharmacistIndex;   // 1-based index

    // ─── Constructor ─────────────────────────────────────────────────────────

    /**
     * @notice Deploys the contract and grants DEFAULT_ADMIN_ROLE and ADMIN_ROLE
     *         to the deployer.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ─── Grant Functions ─────────────────────────────────────────────────────

    /**
     * @notice Grant DOCTOR_ROLE to an address.
     * @param account The address to receive the doctor role.
     */
    function grantDoctor(address account) external onlyRole(ADMIN_ROLE) {
        if (!hasRole(DOCTOR_ROLE, account)) {
            _grantRole(DOCTOR_ROLE, account);
            _doctors.push(account);
            _doctorIndex[account] = _doctors.length; // 1-based
        }
    }

    /**
     * @notice Grant PHARMACIST_ROLE to an address.
     * @param account The address to receive the pharmacist role.
     */
    function grantPharmacist(address account) external onlyRole(ADMIN_ROLE) {
        if (!hasRole(PHARMACIST_ROLE, account)) {
            _grantRole(PHARMACIST_ROLE, account);
            _pharmacists.push(account);
            _pharmacistIndex[account] = _pharmacists.length; // 1-based
        }
    }

    /**
     * @notice Grant PATIENT_ROLE to an address.
     * @param account The address to receive the patient role.
     */
    function grantPatient(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(PATIENT_ROLE, account);
    }

    // ─── Revoke Functions ─────────────────────────────────────────────────────

    /**
     * @notice Revoke DOCTOR_ROLE from an address.
     * @param account The address to lose the doctor role.
     */
    function revokeDoctor(address account) external onlyRole(ADMIN_ROLE) {
        if (hasRole(DOCTOR_ROLE, account)) {
            _revokeRole(DOCTOR_ROLE, account);
            _removeDoctorFromArray(account);
        }
    }

    /**
     * @notice Revoke PHARMACIST_ROLE from an address.
     * @param account The address to lose the pharmacist role.
     */
    function revokePharmacist(address account) external onlyRole(ADMIN_ROLE) {
        if (hasRole(PHARMACIST_ROLE, account)) {
            _revokeRole(PHARMACIST_ROLE, account);
            _removePharmacistFromArray(account);
        }
    }

    // ─── Query Functions ──────────────────────────────────────────────────────

    /// @notice Returns true if `account` has DOCTOR_ROLE.
    function isDoctor(address account) external view returns (bool) {
        return hasRole(DOCTOR_ROLE, account);
    }

    /// @notice Returns true if `account` has PHARMACIST_ROLE.
    function isPharmacist(address account) external view returns (bool) {
        return hasRole(PHARMACIST_ROLE, account);
    }

    /// @notice Returns true if `account` has PATIENT_ROLE.
    function isPatient(address account) external view returns (bool) {
        return hasRole(PATIENT_ROLE, account);
    }

    /// @notice Returns true if `account` has ADMIN_ROLE.
    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    /// @notice Returns the list of all active doctors.
    function getDoctors() external view returns (address[] memory) {
        return _doctors;
    }

    /// @notice Returns the list of all active pharmacists.
    function getPharmacists() external view returns (address[] memory) {
        return _pharmacists;
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────

    function _removeDoctorFromArray(address account) internal {
        uint256 idx = _doctorIndex[account];
        if (idx == 0) return; // not in array

        uint256 arrayIdx = idx - 1; // convert to 0-based
        uint256 lastIdx  = _doctors.length - 1;

        if (arrayIdx != lastIdx) {
            address lastDoctor = _doctors[lastIdx];
            _doctors[arrayIdx] = lastDoctor;
            _doctorIndex[lastDoctor] = idx; // keep 1-based index
        }

        _doctors.pop();
        delete _doctorIndex[account];
    }

    function _removePharmacistFromArray(address account) internal {
        uint256 idx = _pharmacistIndex[account];
        if (idx == 0) return;

        uint256 arrayIdx = idx - 1;
        uint256 lastIdx  = _pharmacists.length - 1;

        if (arrayIdx != lastIdx) {
            address lastPharmacist = _pharmacists[lastIdx];
            _pharmacists[arrayIdx] = lastPharmacist;
            _pharmacistIndex[lastPharmacist] = idx;
        }

        _pharmacists.pop();
        delete _pharmacistIndex[account];
    }
}
