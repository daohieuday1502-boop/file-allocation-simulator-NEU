export const TOTAL_BLOCKS = 100;
export const BLOCK_SIZE_BYTES = 4096;
export const POINTER_SIZE_BYTES = 4;

function createBlock(id) {
  return {
    id,
    status: "FREE",
    fileId: null,
    allocationMethod: null,
    kind: null,
    nextBlock: null,
    indexEntries: []
  };
}

export function createDisk(numberOfBlocks = TOTAL_BLOCKS) {
  const blocks = [];

  for (let id = 0; id < numberOfBlocks; id++) {
    blocks.push(createBlock(id));
  }

  return blocks;
}

export function getFreeBlocks(disk) {
  return disk.filter((block) => block.status === "FREE");
}

export function countFreeBlocks(disk) {
  return getFreeBlocks(disk).length;
}

export function getLargestFreeBlockSequence(disk) {
  let currentLength = 0;
  let largestLength = 0;

  disk.forEach((block) => {
    if (block.status === "FREE") {
      currentLength++;
      largestLength = Math.max(largestLength, currentLength);
    } else {
      currentLength = 0;
    }
  });

  return largestLength;
}

export function releaseFile(disk, fileId) {
  disk.forEach((block) => {
    if (block.fileId === fileId) {
      Object.assign(block, createBlock(block.id));
    }
  });
}
