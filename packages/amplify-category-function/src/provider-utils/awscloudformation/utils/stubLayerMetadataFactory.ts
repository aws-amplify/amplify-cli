/**
 * This is a stub of a class / factory method that will be responsible for loading layer metadata
 */
export const stubLayerMetadataFactory: LayerMetadataFactory = () => ({ versions: [1, 2, 3] });

export type LayerMetadataFactory = (layerName: string) => LayerMetadata;

export interface LayerMetadata {
  versions: number[];
}
