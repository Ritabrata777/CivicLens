// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Civitas {
    struct IssueRecord {
        string issueId;
        string adminId;
        uint256 timestamp;
        string status;
        bool exists;
    }

    mapping(string => IssueRecord) public issues;
    mapping(address => bool) public isAdmin;
    mapping(address => string) public adminNames;
    mapping(address => uint256) public rewards;

    event IssueVerified(string indexed issueId, string adminId, uint256 timestamp, string status);
    event AdminAdded(address indexed admin);
    event AdminNameSet(address indexed admin, string name);
    event RewardDistributed(address indexed to, uint256 amount);

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Caller is not an admin");
        _;
    }

    constructor() {
        isAdmin[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }

    function addAdmin(address _admin) public onlyAdmin {
        require(!isAdmin[_admin], "Address is already an admin");
        isAdmin[_admin] = true;
        emit AdminAdded(_admin);
    }

    function setAdminName(string memory _name) public onlyAdmin {
        require(bytes(adminNames[msg.sender]).length == 0, "Name already set");
        adminNames[msg.sender] = _name;
        emit AdminNameSet(msg.sender, _name);
    }

    function verifyIssue(string memory _issueId, string memory _adminId, string memory _status) public onlyAdmin {
        require(!issues[_issueId].exists, "Issue already verified on chain");
        
        issues[_issueId] = IssueRecord({
            issueId: _issueId,
            adminId: _adminId,
            timestamp: block.timestamp,
            status: _status,
            exists: true
        });

        emit IssueVerified(_issueId, _adminId, block.timestamp, _status);
    }

    function distributeReward(address _to, uint256 _amount) public onlyAdmin {
        rewards[_to] += _amount;
        emit RewardDistributed(_to, _amount);
    }

    function getIssue(string memory _issueId) public view returns (IssueRecord memory) {
        require(issues[_issueId].exists, "Issue not found");
        return issues[_issueId];
    }
}
