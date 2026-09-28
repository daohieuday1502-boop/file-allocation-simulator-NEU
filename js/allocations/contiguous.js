// Contiguous Allocation algorithm
export function allocateContiguous(file, disk) {
  const needed = file.requiredDataBlocks;

  let runStart = -1;
  let runLength = 0;

  for (let i = 0; i < disk.length; i++) {

    if (disk[i].status === "FREE") {

      if (runLength === 0) {
        runStart = i;
      }

      runLength++;

      if (runLength === needed) {
        break;
      }

    } else {
      runStart = -1;
      runLength = 0;
    }
  }

  if (runLength < needed) {
    return {
      success: false,
      message:
        "Contiguous Allocation failed: no sufficiently large contiguous free region."
    };
  }

  const allocatedBlocks = [];

  for (let i = runStart; i < runStart + needed; i++) {
    disk[i].status = "USED";
    disk[i].fileId = file.id;
    disk[i].kind = "DATA";

    allocatedBlocks.push(i);
  }

  file.allocationMethod = "CONTIGUOUS";
  file.startBlock = runStart;
  file.dataBlocks = allocatedBlocks;

  return {
    success: true,
    message: `Allocated ${needed} contiguous data blocks.`
  };
}
