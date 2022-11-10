export const deviceLocationTrackingCrudPermissionsMap: Record<string, string[]> = {
  'Update device position': ['geo:BatchUpdateDevicePosition'],
  'Read latest device position': ['geo:BatchGetDevicePosition', 'geo:GetDevicePosition'],
  'Read device position history': ['geo:GetDevicePositionHistory'],
  'List device positions': ['geo:ListDevicePositions'],
  'Delete device position history': ['geo:BatchDeleteDevicePositionHistory'],
};

export const deviceLocationTrackingAdvancedSettings: Record<string, string> = {
  grantOtherAccess: 'Grant users access to devices other than their own',
  linkGeofenceCollection: 'Link tracker to a geofence collection',
  setPositionFilteringMethod: 'Position filtering setting',
};

export const deviceLocationTrackingPositionFilteringTypes: Record<string, string> = {
  'Accuracy-based': 'AccuracyBased',
  'Distance-based': 'DistanceBased',
  'Time-based': 'TimeBased',
};
