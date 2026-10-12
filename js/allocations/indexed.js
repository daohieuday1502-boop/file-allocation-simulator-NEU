import {
  getFreeBlocks
} from "../core/disk.js";


export function allocateIndexed(
  file,
  disk,
  requirement
) {

  const dataBlocksNeeded =
    requirement.requiredDataBlocks;


  const totalBlocksNeeded =
    requirement.totalPhysicalBlocks;


  const freeBlocks =
    getFreeBlocks(disk);


  if (
    freeBlocks.length <
    totalBlocksNeeded
  ) {

    return {

      success: false,

      method: "INDEXED",

      requiredDataBlocks:
        dataBlocksNeeded,

      indexBlocks: 1,

      totalRequiredBlocks:
        totalBlocksNeeded,

      freeBlocks:
        freeBlocks.length,

      reason:
        "Not enough free blocks for the index block and data blocks."

    };

  }


  /*
    First FREE block becomes
    the Index Block.
  */

  const indexBlock =
    freeBlocks[0];


  /*
    Remaining blocks are
    Data Blocks.
  */

  const dataBlocks =
    freeBlocks.slice(
      1,
      dataBlocksNeeded + 1
    );


  const dataBlockIds =
    dataBlocks.map(
      (block) => block.id
    );


  indexBlock.status = "USED";

  indexBlock.fileId =
    file.id;

  indexBlock.allocationMethod =
    "INDEXED";

  indexBlock.kind = "INDEX";

  indexBlock.indexEntries =
    dataBlockIds;


  dataBlocks.forEach(
    (block) => {

      block.status = "USED";

      block.fileId =
        file.id;

      block.allocationMethod =
        "INDEXED";

      block.kind = "DATA";

    }
  );


  file.allocationMethod =
    "INDEXED";

  file.requiredDataBlocks =
    dataBlocksNeeded;

  file.totalPhysicalBlocks =
    totalBlocksNeeded;

  file.usableBytesPerDataBlock =
    requirement.usableBytesPerDataBlock;

  file.indexBlock =
    indexBlock.id;

  file.dataBlocks =
    dataBlockIds;


  return {

    success: true,

    method: "INDEXED",

    indexBlock:
      indexBlock.id,

    allocatedBlocks:
      dataBlockIds,

    message:
      "Indexed allocation completed successfully."

  };

}
