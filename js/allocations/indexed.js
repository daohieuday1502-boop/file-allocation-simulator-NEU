// Indexed Allocation algorithm
import { getFreeBlocks } from "../core/disk.js";

export function allocateIndexed(file, disk) {
  const neededDataBlocks = file.requiredDataBlocks;

  // Indexed Allocation cần:
  // 1 Index Block + các Data Blocks
  const totalBlocksNeeded = neededDataBlocks + 1;

  const freeBlocks = getFreeBlocks(disk);

  if (freeBlocks.length < totalBlocksNeeded) {
    return {
      success: false,
      message:
        "Indexed Allocation failed: not enough free blocks for index + data."
    };
  }

  const indexBlock = freeBlocks[0];

  const dataBlocks = freeBlocks.slice(
    1,
    neededDataBlocks + 1
  );

  const dataBlockIds = dataBlocks.map(
    (block) => block.id
  );

  // Index Block
  indexBlock.status = "USED";
  indexBlock.fileId = file.id;
  indexBlock.kind = "INDEX";
  indexBlock.indexEntries = dataBlockIds;

  // Data Blocks
  dataBlocks.forEach((block) => {
    block.status = "USED";
    block.fileId = file.id;
    block.kind = "DATA";
  });

  file.allocationMethod = "INDEXED";
  file.indexBlock = indexBlock.id;
  file.dataBlocks = dataBlockIds;

  return {
    success: true,
    message:
      `Allocated 1 index block + ${neededDataBlocks} data blocks.`
  };
}
