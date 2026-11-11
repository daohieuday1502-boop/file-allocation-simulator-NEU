import {
  countFreeBlocks,
  getLargestFreeBlockSequence
} from "../core/disk.js";

export function allocateContiguous(file, disk, requirement) {
  const needed = requirement.requiredDataBlocks;
  const freeBlocks = countFreeBlocks(disk);
  const largestRegion = getLargestFreeBlockSequence(disk);

  if (largestRegion < needed) {
    return {
      success: false,
      method: "CONTIGUOUS",
      requiredBlocks: needed,
      freeBlocks,
      largestFreeBlockSequence: largestRegion
    };
  }

  let runStart = -1;
  let runLength = 0;

  for (let i = 0; i < disk.length; i++) {
    if (disk[i].status !== "FREE") {
      runStart = -1;
      runLength = 0;
      continue;
    }

    if (runLength === 0) {
      runStart = i;
    }

    runLength++;
    if (runLength === needed) {
      break;
    }
  }

  const allocatedBlocks = [];

  for (let i = runStart; i < runStart + needed; i++) {
    disk[i].status = "USED";
    disk[i].fileId = file.id;
    disk[i].allocationMethod = "CONTIGUOUS";
    disk[i].kind = "DATA";
    disk[i].nextBlock = null;
    disk[i].indexEntries = [];
    allocatedBlocks.push(i);
  }

  Object.assign(file, {
    allocationMethod: "CONTIGUOUS",
    requiredDataBlocks: needed,
    totalPhysicalBlocks: requirement.totalPhysicalBlocks,
    usableBytesPerDataBlock: requirement.usableBytesPerDataBlock,
    startBlock: runStart,
    endBlock: runStart + needed - 1,
    indexBlock: null,
    dataBlocks: allocatedBlocks
  });

  return {
    success: true,
    method: "CONTIGUOUS",
    allocatedBlocks
  };
}
