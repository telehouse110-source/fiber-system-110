import { OptiFiberDatabase } from '../types';

export function exportRoutesToCSV(db: OptiFiberDatabase): void {
  const headers = ['Route ID', 'Route Name', 'Fiber Type', 'Core Count', 'Length (m)', 'Start Point', 'End Point', 'Area', 'Zone', 'Installation Type', 'Status', 'Maintenance'];
  const rows = db.routes.map(r => [
    `"${r.routeId}"`,
    `"${r.routeName}"`,
    r.fiberType,
    r.coreCount,
    r.cableLengthMeters,
    `"${r.startPoint}"`,
    `"${r.endPoint}"`,
    `"${r.area}"`,
    `"${r.zone}"`,
    r.installationType,
    r.status,
    r.maintenanceStatus,
  ]);
  downloadCSV([headers.join(','), ...rows.map(e => e.join(','))].join('\n'), 'optifiber_routes.csv');
}

export function exportCablesToCSV(db: OptiFiberDatabase): void {
  const headers = ['Cable ID', 'Brand', 'Cable Type', 'Cores', 'Total Length (m)', 'Installed (m)', 'Remaining (m)', 'Start Location', 'End Location', 'Status', 'Batch Number'];
  const rows = db.cables.map(c => [
    `"${c.cableId}"`,
    `"${c.brand}"`,
    `"${c.cableType}"`,
    c.coreCount,
    c.totalLengthMeters,
    c.installedLengthMeters,
    c.remainingLengthMeters,
    `"${c.startLocation}"`,
    `"${c.endLocation}"`,
    c.status,
    `"${c.batchNumber}"`,
  ]);
  downloadCSV([headers.join(','), ...rows.map(e => e.join(','))].join('\n'), 'optifiber_cables.csv');
}

export function exportSplicesToCSV(db: OptiFiberDatabase): void {
  const headers = ['Splice ID', 'Joint Box ID', 'Tray', 'Incoming Cable', 'In Core', 'In Color', 'Splice Type', 'Loss (dB)', 'Outgoing Cable', 'Out Core', 'Out Color', 'Status', 'Technician'];
  const rows = db.splices.map(s => [
    `"${s.id}"`,
    `"${s.jointBoxId}"`,
    s.trayNumber,
    `"${s.incomingCableId}"`,
    s.incomingCoreNumber,
    s.incomingCoreColor,
    s.spliceType,
    s.spliceLossDb,
    `"${s.outgoingCableId}"`,
    s.outgoingCoreNumber,
    s.outgoingCoreColor,
    s.status,
    `"${s.technician}"`,
  ]);
  downloadCSV([headers.join(','), ...rows.map(e => e.join(','))].join('\n'), 'optifiber_splices.csv');
}

export function exportCustomersToCSV(db: OptiFiberDatabase): void {
  const headers = ['Customer ID', 'Name', 'Phone', 'Email', 'Address', 'Area', 'Package', 'ONU Model', 'ONU Serial', 'Status', 'Splitter', 'Port', 'Rx Power (dBm)'];
  const rows = db.customers.map(c => [
    `"${c.customerId}"`,
    `"${c.name}"`,
    `"${c.phone}"`,
    `"${c.email}"`,
    `"${c.address}"`,
    `"${c.area}"`,
    `"${c.package}"`,
    `"${c.onuModel}"`,
    `"${c.onuSerial}"`,
    c.status,
    `"${c.splitterId || 'N/A'}"`,
    c.splitterPortNumber || 'N/A',
    c.rxPowerDbm,
  ]);
  downloadCSV([headers.join(','), ...rows.map(e => e.join(','))].join('\n'), 'optifiber_customers.csv');
}

export function exportTicketsToCSV(db: OptiFiberDatabase): void {
  const headers = ['Ticket ID', 'Date', 'Problem', 'Priority', 'Status', 'Location', 'Technician', 'Before Signal (dBm)', 'After Signal (dBm)', 'Root Cause', 'Work Performed'];
  const rows = db.tickets.map(t => [
    `"${t.ticketId}"`,
    `"${t.dateTime}"`,
    `"${t.problem}"`,
    t.priority,
    t.status,
    `"${t.location}"`,
    `"${t.technician}"`,
    t.beforeSignalDbm !== undefined ? t.beforeSignalDbm : '',
    t.afterSignalDbm !== undefined ? t.afterSignalDbm : '',
    `"${(t.rootCause || '').replace(/"/g, '""')}"`,
    `"${(t.workPerformed || '').replace(/"/g, '""')}"`,
  ]);
  downloadCSV([headers.join(','), ...rows.map(e => e.join(','))].join('\n'), 'optifiber_maintenance_tickets.csv');
}

function downloadCSV(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
