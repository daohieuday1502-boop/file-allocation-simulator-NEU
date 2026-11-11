import { getFreeBlocks } from "../core/disk.js";

export function allocateLinked(file, disk, requirement) {
  const needed = requirement.requiredDataBlocks;
  const freeBlocks = getFreeBlocks(disk);

  if (freeBlocks.length < needed) {
    return {
      success: false,
      method: "LINKED",
      requiredBlocks: needed,
      freeBlocks: freeBlocks.length,
      message: "Not enough free blocks."
    };
  }

  const selectedBlocks = freeBlocks.slice(0, needed);

  selectedBlocks.forEach((block, position) => {
    Object.assign(block, {
      status: "USED",
      fileId: file.id,
      allocationMethod: "LINKED",
      kind: "DATA",
      nextBlock: selectedBlocks[position + 1]?.id ?? null
    });
  });

  const dataBlocks = selectedBlocks.map((block) => block.id);

  Object.assign(file, {
    allocationMethod: "LINKED",
    requiredDataBlocks: needed,
    totalPhysicalBlocks: requirement.totalPhysicalBlocks,
    usableBytesPerDataBlock: requirement.usableBytesPerDataBlock,
    startBlock: dataBlocks[0],
    endBlock: dataBlocks[dataBlocks.length - 1],
    dataBlocks
  });

  return {
    success: true,
    method: "LINKED",
    allocatedBlocks: dataBlocks,
    message: "Linked allocation completed successfully."
  };
}
