// Virtual Disk model
// Virtual Disk model

export const TOTAL_BLOCKS = 100;
export const BLOCK_SIZE_BYTES = 4096;

export function createDisk(numberOfBlocks = TOTAL_BLOCKS) {
  const blocks = [];

  for (let i = 0; i < numberOfBlocks; i++) {
    blocks.push({
      id: i,

      status: "FREE",

      // File nào đang sở hữu block này
      fileId: null,

      // DATA hoặc INDEX
      kind: null,

      // Dùng cho Linked Allocation
      nextBlock: null,

      // Dùng cho Indexed Allocation
      indexEntries: []
    });
  }

  return blocks;
}

export function getFreeBlocks(disk) {
  return disk.filter((block) => block.status === "FREE");
}

export function releaseFile(disk, fileId) {
  disk.forEach((block) => {
    if (block.fileId === fileId) {
      block.status = "FREE";
      block.fileId = null;
      block.kind = null;
      block.nextBlock = null;
      block.indexEntries = [];
    }
  });
}
