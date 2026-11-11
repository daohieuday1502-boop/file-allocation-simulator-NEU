export function createFile(fileDefinition) {
  return {
    id: fileDefinition.id,
    name: fileDefinition.name,
    sizeBytes: fileDefinition.sizeBytes,
    allocationMethod: null,
    requiredDataBlocks: null,
    totalPhysicalBlocks: null,
    usableBytesPerDataBlock: null,
    startBlock: null,
    endBlock: null,
    indexBlock: null,
    dataBlocks: []
  };
}

export function calculateStorageRequirement(file, method, blockSizeBytes, pointerSizeBytes) {
  if (method === "CONTIGUOUS") {
    const requiredDataBlocks = Math.ceil(file.sizeBytes / blockSizeBytes);

    return {
      method,
      blockSizeBytes,
      usableBytesPerDataBlock: blockSizeBytes,
      pointerSizeBytes: 0,
      requiredDataBlocks,
      indexBlocks: 0,
      totalPhysicalBlocks: requiredDataBlocks
    };
  }

  if (method === "LINKED") {
    const usableBytesPerDataBlock = blockSizeBytes - pointerSizeBytes;
    const requiredDataBlocks = Math.ceil(file.sizeBytes / usableBytesPerDataBlock);

    return {
      method,
      blockSizeBytes,
      usableBytesPerDataBlock,
      pointerSizeBytes,
      requiredDataBlocks,
      indexBlocks: 0,
      totalPhysicalBlocks: requiredDataBlocks
    };
  }

  if (method === "INDEXED") {
    const requiredDataBlocks = Math.ceil(file.sizeBytes / blockSizeBytes);
    const indexBlocks = 1;

    return {
      method,
      blockSizeBytes,
      usableBytesPerDataBlock: blockSizeBytes,
      pointerSizeBytes,
      requiredDataBlocks,
      indexBlocks,
      totalPhysicalBlocks: requiredDataBlocks + indexBlocks
    };
  }

  throw new Error("Unknown allocation method.");
}
