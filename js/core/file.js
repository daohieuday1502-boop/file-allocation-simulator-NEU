export function createFile(
  fileDefinition
) {

  return {

    id: fileDefinition.id,

    name: fileDefinition.name,

    sizeBytes:
      fileDefinition.sizeBytes,

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


/*
  Calculate storage requirement
  depending on allocation method.

  This does NOT allocate blocks.

  It only calculates how much
  storage the selected file needs.
*/

export function calculateStorageRequirement(
  file,
  method,
  blockSizeBytes,
  pointerSizeBytes
) {

  /*
    CONTIGUOUS
  */

  if (method === "CONTIGUOUS") {

    const requiredDataBlocks =
      Math.ceil(
        file.sizeBytes /
        blockSizeBytes
      );


    return {

      method: method,

      blockSizeBytes:
        blockSizeBytes,

      usableBytesPerDataBlock:
        blockSizeBytes,

      pointerSizeBytes: 0,

      requiredDataBlocks:
        requiredDataBlocks,

      indexBlocks: 0,

      totalPhysicalBlocks:
        requiredDataBlocks

    };

  }


  /*
    LINKED

    Each block reserves space
    for a pointer to the next block.

    Example simulation:
    4096-byte block
    - 4-byte pointer
    = 4092 bytes data.
  */

  if (method === "LINKED") {

    const usableBytesPerDataBlock =
      blockSizeBytes -
      pointerSizeBytes;


    const requiredDataBlocks =
      Math.ceil(
        file.sizeBytes /
        usableBytesPerDataBlock
      );


    return {

      method: method,

      blockSizeBytes:
        blockSizeBytes,

      usableBytesPerDataBlock:
        usableBytesPerDataBlock,

      pointerSizeBytes:
        pointerSizeBytes,

      requiredDataBlocks:
        requiredDataBlocks,

      indexBlocks: 0,

      totalPhysicalBlocks:
        requiredDataBlocks

    };

  }


  /*
    INDEXED

    Data blocks can use the complete
    block for file data.

    One additional Index Block
    stores pointers to the data blocks.
  */

  if (method === "INDEXED") {

    const requiredDataBlocks =
      Math.ceil(
        file.sizeBytes /
        blockSizeBytes
      );


    const indexBlocks = 1;


    return {

      method: method,

      blockSizeBytes:
        blockSizeBytes,

      usableBytesPerDataBlock:
        blockSizeBytes,

      pointerSizeBytes:
        pointerSizeBytes,

      requiredDataBlocks:
        requiredDataBlocks,

      indexBlocks:
        indexBlocks,

      totalPhysicalBlocks:
        requiredDataBlocks +
        indexBlocks

    };

  }


  throw new Error(
    "Unknown allocation method."
  );

}
