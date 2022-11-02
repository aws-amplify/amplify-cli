export const deviceLocationTrackingCrudPermissionsMap: Record<string, string[]> = {
  'Update device position': ['geo:BatchUpdateDevicePosition'],
  'Read latest device position': ['geo:BatchGetDevicePosition', 'geo:GetDevicePosition'],
  'Read device position history': ['geo:GetDevicePositionHistory'],
  'List device positions': ['geo:ListDevicePositions'],
  'Delete device position history': ['geo:BatchDeleteDevicePositionHistory'],
};
