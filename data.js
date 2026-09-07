/* ============================================================
   PMS 443 — Surface Ship Sustainment Cyber RMF
   Fake eMASS / Fleet Dataset (realistic demo data)
   ============================================================ */

const SHIP_CLASSES = [
  { id: 'ddg', name: 'Arleigh Burke (DDG-51)', type: 'Destroyer', icon: 'destroyer' },
  { id: 'cg', name: 'Ticonderoga (CG-47)', type: 'Cruiser', icon: 'cruiser' },
  { id: 'lpd', name: 'San Antonio (LPD-17)', type: 'Amphibious', icon: 'amphib' },
  { id: 'lcs', name: 'Freedom / Independence (LCS)', type: 'Littoral', icon: 'lcs' },
  { id: 'lhd', name: 'Wasp (LHD-1)', type: 'Amphibious', icon: 'amphib' },
  { id: 'ffg', name: 'Constellation (FFG-62)', type: 'Frigate', icon: 'frigate' },
];

const HULLS = [
  { id: 'ddg51', hull: 'DDG-51', name: 'USS Arleigh Burke', classId: 'ddg', homeport: 'Norfolk', status: 'Deployed', risk: 'high', rmfStep: 'Monitor', authStatus: 'ATO' },
  { id: 'ddg78', hull: 'DDG-78', name: 'USS Porter', classId: 'ddg', homeport: 'Rota', status: 'Deployed', risk: 'critical', rmfStep: 'Assess', authStatus: 'cATO' },
  { id: 'ddg100', hull: 'DDG-100', name: 'USS Kidd', classId: 'ddg', homeport: 'San Diego', status: 'Inport', risk: 'moderate', rmfStep: 'Monitor', authStatus: 'ATO' },
  { id: 'ddg116', hull: 'DDG-116', name: 'USS Thomas Hudner', classId: 'ddg', homeport: 'Mayport', status: 'Underway', risk: 'low', rmfStep: 'Monitor', authStatus: 'ATO' },
  { id: 'ddg125', hull: 'DDG-125', name: 'USS Jack H. Lucas', classId: 'ddg', homeport: 'San Diego', status: 'Underway', risk: 'moderate', rmfStep: 'Authorize', authStatus: 'Pending' },
  { id: 'cg56', hull: 'CG-56', name: 'USS San Jacinto', classId: 'cg', homeport: 'Norfolk', status: 'Inport', risk: 'high', rmfStep: 'Implement', authStatus: 'cATO' },
  { id: 'cg69', hull: 'CG-69', name: 'USS Vicksburg', classId: 'cg', homeport: 'Mayport', status: 'Maintenance', risk: 'moderate', rmfStep: 'Assess', authStatus: 'ATO' },
  { id: 'lpd17', hull: 'LPD-17', name: 'USS San Antonio', classId: 'lpd', homeport: 'Norfolk', status: 'Deployed', risk: 'high', rmfStep: 'Monitor', authStatus: 'ATO' },
  { id: 'lpd21', hull: 'LPD-21', name: 'USS New York', classId: 'lpd', homeport: 'Mayport', status: 'Inport', risk: 'moderate', rmfStep: 'Select', authStatus: 'Pending' },
  { id: 'lcs7', hull: 'LCS-7', name: 'USS Detroit', classId: 'lcs', homeport: 'San Diego', status: 'Deployed', risk: 'high', rmfStep: 'Assess', authStatus: 'cATO' },
  { id: 'lcs14', hull: 'LCS-14', name: 'USS Manchester', classId: 'lcs', homeport: 'San Diego', status: 'Inport', risk: 'low', rmfStep: 'Monitor', authStatus: 'ATO' },
  { id: 'lhd1', hull: 'LHD-1', name: 'USS Wasp', classId: 'lhd', homeport: 'Norfolk', status: 'Deployed', risk: 'moderate', rmfStep: 'Monitor', authStatus: 'ATO' },
  { id: 'ffg62', hull: 'FFG-62', name: 'USS Constellation', classId: 'ffg', homeport: 'Mayport', status: 'Construction', risk: 'low', rmfStep: 'Categorize', authStatus: 'None' },
];

const RMF_STEPS = [
  { id: 'categorize', name: 'Categorize', short: 'CAT' },
  { id: 'select', name: 'Select', short: 'SEL' },
  { id: 'implement', name: 'Implement', short: 'IMP' },
  { id: 'assess', name: 'Assess', short: 'ASM' },
  { id: 'authorize', name: 'Authorize', short: 'AUTH' },
  { id: 'monitor', name: 'Monitor', short: 'MON' },
];

const COMPARTMENTS = [
  { id: 'bridge', name: 'Bridge', deck: '01', systems: ['Navigation Suite', 'ECDIS', 'Comms'], risk: 'high' },
  { id: 'cic', name: 'Combat Information Center (CIC)', deck: '01', systems: ['Aegis Weapon System', 'SPY-1/6', 'CEC', 'C2 Displays'], risk: 'critical' },
  { id: 'fwd_equip', name: 'Forward Equipment Room', deck: '2', systems: ['Radar Processors', 'IFF', 'Sensor Links'], risk: 'high' },
  { id: 'sonar', name: 'Sonar Control', deck: '2', systems: ['SQS-53C', 'Towed Array'], risk: 'moderate' },
  { id: 'server', name: 'Server / Data Center', deck: '2', systems: ['ADNS', 'CANES', 'ISNS', 'CMS'], risk: 'critical' },
  { id: 'radio', name: 'Radio Room', deck: '01', systems: ['HF/VHF/UHF', 'SATCOM', 'Link-16'], risk: 'high' },
  { id: 'enginerm', name: 'Aft Machinery Room / Eng Control', deck: '3', systems: ['Machinery Control', 'PLC Network', 'ICS/OT'], risk: 'high' },
  { id: 'magazine', name: 'Magazine / Weapons', deck: '3', systems: ['VLS Control', 'Gun Fire Control'], risk: 'moderate' },
  { id: 'helo', name: 'Hangar / Flight Deck', deck: '1', systems: ['Helo Avionics Link', 'UAV C2'], risk: 'low' },
  { id: 'admin', name: 'Admin / Admin LAN', deck: '2', systems: ['NIPR', 'SIPR Workstations'], risk: 'moderate' },
];

const POAMS = [
  { id: 'POAM-2024-0142', title: 'Unpatched Aegis Display System CVE-2024-XXXX', hullId: 'ddg78', control: 'SI-2', status: 'Open', risk: 'critical', due: '2026-09-30', progress: 35, owner: 'ISSM', compartment: 'cic', mitigation: 'Apply vendor patch bundle; interim ACLs on display VLAN; isolate until ISEA validates' },
  { id: 'POAM-2024-0187', title: 'Weak Authentication on Machinery Control PLCs', hullId: 'ddg51', control: 'IA-2', status: 'Ongoing', risk: 'high', due: '2026-10-15', progress: 60, owner: 'Engineer', compartment: 'enginerm', mitigation: 'Implement MFA gateway; segment ICS network; replace default credentials' },
  { id: 'POAM-2025-0031', title: 'Expired TLS Certs on ADNS Edge Nodes', hullId: 'cg56', control: 'SC-8', status: 'Open', risk: 'high', due: '2026-09-20', progress: 20, owner: 'Network', compartment: 'radio', mitigation: 'Rotate certs; automate renewal via Navy PKI service' },
  { id: 'POAM-2025-0055', title: 'Missing Continuous Monitoring for CANES', hullId: 'lcs7', control: 'CA-7', status: 'Ongoing', risk: 'moderate', due: '2026-11-01', progress: 45, owner: 'ISSO', compartment: 'server', mitigation: 'Deploy ACAS sensors; integrate with eMASS continuous monitoring feed' },
  { id: 'POAM-2025-0078', title: 'Incomplete Audit Logging on SIPR Workstations', hullId: 'ddg100', control: 'AU-2', status: 'Open', risk: 'moderate', due: '2026-10-01', progress: 10, owner: 'ISSM', compartment: 'admin', mitigation: 'Enable advanced audit policy; forward logs to SIEM collector' },
  { id: 'POAM-2025-0092', title: 'Legacy Windows Server 2012 EOL on ISNS', hullId: 'lhd1', control: 'SA-22', status: 'Ongoing', risk: 'critical', due: '2026-09-15', progress: 70, owner: 'SysAdmin', compartment: 'server', mitigation: 'Migrate to Win Server 2022; isolate remaining 2012 hosts until complete' },
  { id: 'POAM-2025-0110', title: 'Insufficient Physical Access Control to Server Rm', hullId: 'cg69', control: 'PE-3', status: 'Closed', risk: 'low', due: '2026-08-01', progress: 100, owner: 'Security', compartment: 'server', mitigation: 'Installed badge + biometric; completed and residual risk accepted' },
  { id: 'POAM-2025-0125', title: 'Unencrypted Link-16 Data Segments', hullId: 'ddg116', control: 'SC-13', status: 'Open', risk: 'high', due: '2026-12-01', progress: 15, owner: 'C5I', compartment: 'radio', mitigation: 'Enable crypto on terminals; update TTP; re-key schedule' },
  { id: 'POAM-2025-0140', title: 'Default Credentials on UAV Ground Station', hullId: 'lcs14', control: 'IA-5', status: 'Ongoing', risk: 'high', due: '2026-09-25', progress: 50, owner: 'Air Ops', compartment: 'helo', mitigation: 'Force password change; enforce certificate authentication' },
  { id: 'POAM-2025-0158', title: 'Missing Vulnerability Scans for OT Network', hullId: 'ddg78', control: 'RA-5', status: 'Open', risk: 'critical', due: '2026-09-10', progress: 5, owner: 'ISSM', compartment: 'enginerm', mitigation: 'Schedule OT-safe scan window; engage ISEA for passive tools' },
  { id: 'POAM-2025-0171', title: 'Incomplete Boundary Defense Documentation', hullId: 'ffg62', control: 'SC-7', status: 'Ongoing', risk: 'moderate', due: '2026-11-15', progress: 40, owner: 'Architect', compartment: 'server', mitigation: 'Update SSP; diagram CANES enclaves for new construction baseline' },
  { id: 'POAM-2025-0189', title: 'Delayed Patch Cycle for SPY-6 Software', hullId: 'ddg51', control: 'SI-2', status: 'Open', risk: 'high', due: '2026-10-30', progress: 25, owner: 'Radar', compartment: 'fwd_equip', mitigation: 'Coordinate with ISEA for accelerated IAVA deployment' },
  { id: 'POAM-2025-0201', title: 'CIC Console Privilege Escalation Path', hullId: 'ddg125', control: 'AC-6', status: 'Open', risk: 'high', due: '2026-10-20', progress: 30, owner: 'ISSM', compartment: 'cic', mitigation: 'Least-privilege rebaseline; remove local admin from watchstanders' },
  { id: 'POAM-2025-0215', title: 'LPD-17 CANES Boundary Firewall Rule Drift', hullId: 'lpd17', control: 'SC-7', status: 'Ongoing', risk: 'high', due: '2026-10-05', progress: 55, owner: 'Network', compartment: 'server', mitigation: 'Reconcile ruleset vs SSP; enable change control workflow' },
  { id: 'POAM-2025-0228', title: 'Forward Equip Room Switch Firmware Out of Date', hullId: 'lpd21', control: 'SI-2', status: 'Open', risk: 'moderate', due: '2026-11-10', progress: 20, owner: 'C5I', compartment: 'fwd_equip', mitigation: 'Apply vendor firmware; verify after maintenance availability' },
  { id: 'POAM-2025-0240', title: 'IA-2 Failures on DDG-51 Machinery Auth', hullId: 'ddg51', control: 'IA-2', status: 'Open', risk: 'critical', due: '2026-09-28', progress: 40, owner: 'ISSO', compartment: 'enginerm', mitigation: 'Deploy CAC/PIV gateway for HMI; interim dual-control SOP until MFA live' },
];

const CONTROLS = [
  { id: 'AC-2', family: 'Access Control', title: 'Account Management', status: 'Approved', inheritance: 'Hybrid', risk: 'low', hulls: ['all'] },
  { id: 'AC-6', family: 'Access Control', title: 'Least Privilege', status: 'Conditionally Approved', inheritance: 'System', risk: 'high', hulls: ['ddg125'] },
  { id: 'AC-17', family: 'Access Control', title: 'Remote Access', status: 'Conditionally Approved', inheritance: 'System', risk: 'high', hulls: ['ddg78', 'lcs7'] },
  { id: 'AU-2', family: 'Audit & Accountability', title: 'Event Logging', status: 'Conditionally Approved', inheritance: 'System', risk: 'moderate', hulls: ['ddg100', 'cg56'] },
  { id: 'CA-7', family: 'Assessment', title: 'Continuous Monitoring', status: 'Non-Compliant', inheritance: 'System', risk: 'moderate', hulls: ['lcs7', 'lhd1'] },
  { id: 'CM-6', family: 'Config Mgmt', title: 'Configuration Settings', status: 'Approved', inheritance: 'Hybrid', risk: 'low', hulls: ['all'] },
  { id: 'IA-2', family: 'Identification', title: 'Identification & Authentication', status: 'Non-Compliant', inheritance: 'System', risk: 'critical', hulls: ['ddg51'] },
  { id: 'IA-5', family: 'Identification', title: 'Authenticator Management', status: 'Conditionally Approved', inheritance: 'System', risk: 'high', hulls: ['lcs14'] },
  { id: 'PE-3', family: 'Physical', title: 'Physical Access Control', status: 'Approved', inheritance: 'System', risk: 'low', hulls: ['cg69'] },
  { id: 'RA-5', family: 'Risk Assessment', title: 'Vulnerability Monitoring', status: 'Non-Compliant', inheritance: 'System', risk: 'critical', hulls: ['ddg78'] },
  { id: 'SA-22', family: 'System Acquisition', title: 'Unsupported System Components', status: 'Conditionally Approved', inheritance: 'System', risk: 'critical', hulls: ['lhd1'] },
  { id: 'SC-7', family: 'System & Comm', title: 'Boundary Protection', status: 'Conditionally Approved', inheritance: 'Hybrid', risk: 'moderate', hulls: ['ffg62', 'lpd17'] },
  { id: 'SC-8', family: 'System & Comm', title: 'Transmission Confidentiality', status: 'Conditionally Approved', inheritance: 'System', risk: 'high', hulls: ['cg56'] },
  { id: 'SC-13', family: 'System & Comm', title: 'Cryptographic Protection', status: 'Non-Compliant', inheritance: 'System', risk: 'high', hulls: ['ddg116'] },
  { id: 'SI-2', family: 'System Integrity', title: 'Flaw Remediation', status: 'Conditionally Approved', inheritance: 'System', risk: 'critical', hulls: ['ddg78', 'ddg51', 'lpd21'] },
  { id: 'SI-4', family: 'System Integrity', title: 'System Monitoring', status: 'Approved', inheritance: 'Hybrid', risk: 'low', hulls: ['all'] },
];

const HARDWARE = [
  { id: 'HW-001', name: 'SPY-6(V)1 Radar Array', type: 'Sensor', hullId: 'ddg116', compartment: 'fwd_equip', status: 'Operational', risk: 'low', ip: 'N/A (OT)', os: 'Vendor RTOS' },
  { id: 'HW-002', name: 'Aegis Baseline 9 Display Suite', type: 'C2 Display', hullId: 'ddg78', compartment: 'cic', status: 'Degraded', risk: 'critical', ip: '10.45.12.0/24', os: 'RHEL 7 (EOL risk)' },
  { id: 'HW-003', name: 'CANES Core Server Rack', type: 'Server', hullId: 'ddg51', compartment: 'server', status: 'Operational', risk: 'moderate', ip: '10.20.0.0/16', os: 'RHEL 8' },
  { id: 'HW-004', name: 'ADNS Edge Router', type: 'Network', hullId: 'cg56', compartment: 'radio', status: 'Operational', risk: 'high', ip: '10.30.1.1', os: 'IOS-XE' },
  { id: 'HW-005', name: 'Machinery Control PLC Cabinet', type: 'ICS/OT', hullId: 'ddg51', compartment: 'enginerm', status: 'Operational', risk: 'high', ip: '192.168.50.0/24', os: 'Vendor Firmware' },
  { id: 'HW-006', name: 'Link-16 Terminal (MIDS)', type: 'Tactical Data', hullId: 'ddg116', compartment: 'radio', status: 'Operational', risk: 'high', ip: 'N/A', os: 'Vendor' },
  { id: 'HW-007', name: 'ISNS File Server', type: 'Server', hullId: 'lhd1', compartment: 'server', status: 'EOL', risk: 'critical', ip: '10.40.2.10', os: 'Windows Server 2012' },
  { id: 'HW-008', name: 'UAV Ground Control Station', type: 'Unmanned', hullId: 'lcs14', compartment: 'helo', status: 'Operational', risk: 'high', ip: '10.55.8.5', os: 'Windows 10 IoT' },
  { id: 'HW-009', name: 'SQS-53C Sonar Processor', type: 'Sensor', hullId: 'ddg100', compartment: 'sonar', status: 'Operational', risk: 'moderate', ip: 'N/A (OT)', os: 'Vendor' },
  { id: 'HW-010', name: 'VLS Fire Control Computer', type: 'Weapons', hullId: 'cg69', compartment: 'magazine', status: 'Operational', risk: 'moderate', ip: 'N/A', os: 'Vendor RTOS' },
  { id: 'HW-011', name: 'SATCOM WSC-6 Terminal', type: 'Comms', hullId: 'lcs7', compartment: 'radio', status: 'Operational', risk: 'moderate', ip: '10.60.1.1', os: 'Vendor' },
  { id: 'HW-012', name: 'SIPR Workstation Cluster', type: 'Endpoint', hullId: 'ddg100', compartment: 'admin', status: 'Operational', risk: 'moderate', ip: '10.21.5.0/24', os: 'Windows 10' },
  { id: 'HW-013', name: 'CIC Tactical Console Array', type: 'C2 Display', hullId: 'ddg125', compartment: 'cic', status: 'Operational', risk: 'high', ip: '10.48.1.0/24', os: 'RHEL 8' },
  { id: 'HW-014', name: 'LPD CANES Core Switch Stack', type: 'Network', hullId: 'lpd17', compartment: 'server', status: 'Operational', risk: 'high', ip: '10.70.0.0/16', os: 'NX-OS' },
  { id: 'HW-015', name: 'Bridge Navigation Console', type: 'Navigation', hullId: 'ddg51', compartment: 'bridge', status: 'Operational', risk: 'moderate', ip: '10.20.5.10', os: 'Vendor Linux' },
  { id: 'HW-016', name: 'Forward Equip Sensor Switch', type: 'Network', hullId: 'lpd21', compartment: 'fwd_equip', status: 'Degraded', risk: 'moderate', ip: '10.71.2.1', os: 'IOS 15.x' },
  { id: 'HW-017', name: 'Aft Machinery HMI Station', type: 'ICS/OT', hullId: 'ddg51', compartment: 'enginerm', status: 'Operational', risk: 'critical', ip: '192.168.50.10', os: 'Windows Embedded' },
  { id: 'HW-018', name: 'SPY-1D Processor Rack', type: 'Sensor', hullId: 'ddg78', compartment: 'fwd_equip', status: 'Operational', risk: 'high', ip: 'N/A (OT)', os: 'Vendor RTOS' },
];

const SOFTWARE = [
  { id: 'SW-001', name: 'Aegis Combat System BL9.C2', type: 'Combat System', hullId: 'ddg78', version: '9.C2.12', status: 'Active', risk: 'critical', vendor: 'Lockheed Martin' },
  { id: 'SW-002', name: 'CANES Baseline 2.1', type: 'C4I Platform', hullId: 'ddg51', version: '2.1.4', status: 'Active', risk: 'moderate', vendor: 'NIWC' },
  { id: 'SW-003', name: 'ACAS / Nessus Scanner', type: 'Vulnerability', hullId: 'all', version: '10.8.1', status: 'Active', risk: 'low', vendor: 'Tenable' },
  { id: 'SW-004', name: 'HBSS / McAfee EPO', type: 'Endpoint Protection', hullId: 'all', version: '5.10', status: 'Active', risk: 'low', vendor: 'Trellix' },
  { id: 'SW-005', name: 'ADNS Management Suite', type: 'Network Mgmt', hullId: 'cg56', version: '4.2', status: 'Active', risk: 'high', vendor: 'Navy' },
  { id: 'SW-006', name: 'Machinery Control HMI', type: 'OT HMI', hullId: 'ddg51', version: '3.1.0', status: 'Active', risk: 'high', vendor: 'OEM' },
  { id: 'SW-007', name: 'Link-16 Network Manager', type: 'Tactical', hullId: 'ddg116', version: '2.0.5', status: 'Active', risk: 'high', vendor: 'Vendor' },
  { id: 'SW-008', name: 'ISNS Domain Controllers', type: 'Directory', hullId: 'lhd1', version: '2012 R2', status: 'EOL', risk: 'critical', vendor: 'Microsoft' },
  { id: 'SW-009', name: 'eMASS Client Sync', type: 'RMF Tool', hullId: 'all', version: '6.4', status: 'Active', risk: 'low', vendor: 'DoD' },
  { id: 'SW-010', name: 'UAV C2 Software', type: 'Unmanned', hullId: 'lcs14', version: '1.8.2', status: 'Active', risk: 'high', vendor: 'Vendor' },
  { id: 'SW-011', name: 'SIEM Collector (Splunk)', type: 'Monitoring', hullId: 'all', version: '9.1', status: 'Active', risk: 'low', vendor: 'Splunk' },
  { id: 'SW-012', name: 'Navigation ECDIS', type: 'Navigation', hullId: 'all', version: '5.3', status: 'Active', risk: 'moderate', vendor: 'OEM' },
  { id: 'SW-013', name: 'CMS (Combat Mgmt System)', type: 'Combat System', hullId: 'lpd17', version: '4.1', status: 'Active', risk: 'moderate', vendor: 'Vendor' },
  { id: 'SW-014', name: 'Aegis BL10 Core', type: 'Combat System', hullId: 'ddg125', version: '10.0.3', status: 'Active', risk: 'moderate', vendor: 'Lockheed Martin' },
];

const MITIGATIONS = [
  { id: 'MIT-01', poamId: 'POAM-2024-0142', step: 1, title: 'Isolate display VLAN', status: 'Done', due: '2026-08-15', owner: 'Network' },
  { id: 'MIT-02', poamId: 'POAM-2024-0142', step: 2, title: 'Apply emergency ACLs', status: 'Done', due: '2026-08-20', owner: 'ISSM' },
  { id: 'MIT-03', poamId: 'POAM-2024-0142', step: 3, title: 'Test vendor patch in lab', status: 'In Progress', due: '2026-09-10', owner: 'ISEA' },
  { id: 'MIT-04', poamId: 'POAM-2024-0142', step: 4, title: 'Deploy patch to DDG-78', status: 'Planned', due: '2026-09-25', owner: 'C5I' },
  { id: 'MIT-05', poamId: 'POAM-2024-0187', step: 1, title: 'Document ICS topology', status: 'Done', due: '2026-07-01', owner: 'Engineer' },
  { id: 'MIT-06', poamId: 'POAM-2024-0187', step: 2, title: 'Deploy jump-host MFA', status: 'In Progress', due: '2026-09-01', owner: 'ISSM' },
  { id: 'MIT-07', poamId: 'POAM-2024-0187', step: 3, title: 'Segment PLC network', status: 'Planned', due: '2026-10-01', owner: 'Network' },
  { id: 'MIT-08', poamId: 'POAM-2025-0031', step: 1, title: 'Inventory expired certs', status: 'Done', due: '2026-08-25', owner: 'Network' },
  { id: 'MIT-09', poamId: 'POAM-2025-0031', step: 2, title: 'Issue new certs from PKI', status: 'In Progress', due: '2026-09-12', owner: 'PKI' },
  { id: 'MIT-10', poamId: 'POAM-2025-0092', step: 1, title: 'Stand up Win2022 servers', status: 'Done', due: '2026-07-15', owner: 'SysAdmin' },
  { id: 'MIT-11', poamId: 'POAM-2025-0092', step: 2, title: 'Migrate ISNS roles', status: 'In Progress', due: '2026-09-05', owner: 'SysAdmin' },
  { id: 'MIT-12', poamId: 'POAM-2025-0092', step: 3, title: 'Decommission 2012 hosts', status: 'Planned', due: '2026-09-15', owner: 'SysAdmin' },
  { id: 'MIT-13', poamId: 'POAM-2025-0158', step: 1, title: 'Define OT scan windows', status: 'In Progress', due: '2026-09-08', owner: 'ISSM' },
  { id: 'MIT-14', poamId: 'POAM-2025-0158', step: 2, title: 'Coordinate with ISEA', status: 'Planned', due: '2026-09-12', owner: 'ISEA' },
  { id: 'MIT-15', poamId: 'POAM-2025-0240', step: 1, title: 'Dual-control SOP for HMI', status: 'Done', due: '2026-08-20', owner: 'ISSO' },
  { id: 'MIT-16', poamId: 'POAM-2025-0240', step: 2, title: 'Deploy CAC/PIV gateway', status: 'In Progress', due: '2026-09-15', owner: 'ISSM' },
  { id: 'MIT-17', poamId: 'POAM-2025-0240', step: 3, title: 'Validate IA-2 compliance', status: 'Planned', due: '2026-09-28', owner: 'SCA' },
  { id: 'MIT-18', poamId: 'POAM-2025-0215', step: 1, title: 'Export live firewall config', status: 'Done', due: '2026-08-28', owner: 'Network' },
  { id: 'MIT-19', poamId: 'POAM-2025-0215', step: 2, title: 'Diff vs SSP authorized rules', status: 'In Progress', due: '2026-09-20', owner: 'ISSO' },
];

const ALERTS = [
  { id: 'ALT-01', severity: 'critical', title: 'Critical POA&M overdue risk: OT scan gap', hull: 'DDG-78', time: '2h ago', poamId: 'POAM-2025-0158' },
  { id: 'ALT-02', severity: 'critical', title: 'Aegis display unpatched CVE exposure', hull: 'DDG-78', time: '5h ago', poamId: 'POAM-2024-0142' },
  { id: 'ALT-03', severity: 'critical', title: 'IA-2 non-compliance on DDG-51 machinery auth', hull: 'DDG-51', time: '3h ago', poamId: 'POAM-2025-0240' },
  { id: 'ALT-04', severity: 'high', title: 'TLS cert expiry window < 14 days', hull: 'CG-56', time: '8h ago', poamId: 'POAM-2025-0031' },
  { id: 'ALT-05', severity: 'high', title: 'EOL Windows Server still hosting ISNS', hull: 'LHD-1', time: '1d ago', poamId: 'POAM-2025-0092' },
  { id: 'ALT-06', severity: 'high', title: 'Predictive: PLC auth risk rising', hull: 'DDG-51', time: '1d ago', poamId: 'POAM-2024-0187' },
  { id: 'ALT-07', severity: 'high', title: 'LPD-17 CANES firewall rule drift', hull: 'LPD-17', time: '6h ago', poamId: 'POAM-2025-0215' },
  { id: 'ALT-08', severity: 'moderate', title: 'CANES continuous monitoring incomplete', hull: 'LCS-7', time: '2d ago', poamId: 'POAM-2025-0055' },
  { id: 'ALT-09', severity: 'moderate', title: 'Audit policy drift on SIPR endpoints', hull: 'DDG-100', time: '2d ago', poamId: 'POAM-2025-0078' },
];

const TREND_DATA = {
  labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  openPoams: [48, 44, 40, 38, 36, 32, 28],
  closedPoams: [4, 7, 11, 8, 10, 13, 9],
  vulnCounts: [312, 298, 275, 260, 248, 231, 210],
  burnDown: [18, 22, 25, 19, 24, 28, 26],
  riskScore: [72, 68, 65, 63, 60, 58, 55],
  predictedRisk: [null, null, null, null, null, 55, 52, 58, 64],
  predictedLabels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
  controlImpl: [62, 64, 67, 70, 72, 74, 76],
  criticalAssets: [9, 8, 8, 7, 7, 6, 6],
  patchLagDays: [42, 40, 38, 36, 34, 32, 35],
};

const ARTIFACTS = [
  { name: 'SSP_DDG78_Aegis.pdf', type: 'SSP', uploaded: '2026-08-12', size: '2.4 MB' },
  { name: 'POAM_Export_Sep2026.xlsx', type: 'POA&M', uploaded: '2026-09-01', size: '890 KB' },
  { name: 'Control_Implementation_Summary.json', type: 'Controls', uploaded: '2026-09-03', size: '1.1 MB' },
  { name: 'ACAS_Scan_DDG51_Aug.xml', type: 'Scan', uploaded: '2026-08-28', size: '15.2 MB' },
  { name: 'Boundary_Diagram_CANES.vsdx', type: 'Architecture', uploaded: '2026-07-20', size: '3.8 MB' },
  { name: 'RMF_Package_LPD17_eMASS.xml', type: 'eMASS Export', uploaded: '2026-09-02', size: '4.6 MB' },
];

let packageArtifacts = [
  { name: 'RMF_Package_Index.pdf', type: 'Package', uploaded: '2026-09-01', forRAG: true },
  { name: 'Aegis_Security_Architecture.pdf', type: 'Architecture', uploaded: '2026-08-15', forRAG: true },
  { name: 'OT_Network_Segmentation_Guide.docx', type: 'Guide', uploaded: '2026-08-20', forRAG: true },
  { name: 'IA-2_Mitigation_Strategy_DDG51.pdf', type: 'POA&M Detail', uploaded: '2026-08-22', forRAG: true },
  { name: 'PMS443_Surface_Sustainment_RMF_SOP.pdf', type: 'SOP', uploaded: '2026-07-10', forRAG: true },
];
