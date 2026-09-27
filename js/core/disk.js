// Virtual Disk model
export function createDisk(numberOfBlocks = 20) {
  const blocks = [];

  for (let i = 0; i < numberOfBlocks; i++) {
    blocks.push({
      id: i,
      status: "FREE",
      fileId: null
    });
  }

  return blocks;
}
