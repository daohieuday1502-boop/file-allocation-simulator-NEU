import { getFreeBlocks } from "../core/disk.js";

export function allocateIndexed(file, disk, requirement) {
  const dataBlocksNeeded = requirement.requiredDataBlocks;
  const totalBlocksNeeded = requirement.totalPhysicalBlocks;
  const freeBlocks = getFreeBlocks(disk);

  if (freeBlocks.length < totalBlocksNeeded) {
    return {
      success: false,
      method: "INDEXED",
      requiredDataBlocks: dataBlocksNeeded,
      indexBlocks: 1,
      totalRequiredBlocks: totalBlocksNeeded,
      freeBlocks: freeBlocks.length,
      reason: "Not enough free blocks for the index block and data blocks."
    };
  }

  const indexBlock = freeBlocks[0];
  const dataBlocks = freeBlocks.slice(1, dataBlocksNeeded + 1);
  const dataBlockIds = dataBlocks.map((block) => block.id);

  Object.assign(indexBlock, {
    status: "USED",
    fileId: file.id,
    allocationMethod: "INDEXED",
    kind: "INDEX",
    indexEntries: dataBlockIds
  });

  dataBlocks.forEach((block) => {
    Object.assign(block, {
      status: "USED",
      fileId: file.id,
      allocationMethod: "INDEXED",
      kind: "DATA"
    });
  });

  Object.assign(file, {
    allocationMethod: "INDEXED",
    requiredDataBlocks: dataBlocksNeeded,
    totalPhysicalBlocks: totalBlocksNeeded,
    usableBytesPerDataBlock: requirement.usableBytesPerDataBlock,
    indexBlock: indexBlock.id,
    dataBlocks: dataBlockIds
  });

  return {
    success: true,
    method: "INDEXED",
    indexBlock: indexBlock.id,
    allocatedBlocks: dataBlockIds,
    message: "Indexed allocation completed successfully."
  };
}
