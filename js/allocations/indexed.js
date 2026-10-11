
import { getFreeBlocks } from "../core/disk.js";

export function allocateIndexed(file, disk) {
  const needed = file.requiredDataBlocks;
  const freeBlocks = getFreeBlocks(disk);

  // Can 1 index block va N data block
  if (freeBlocks.length < needed + 1) {
    return {
      success: false,
      message: "Indexed Allocation failed: not enough free blocks."
    };
  }

  // Chon index block dau tien
  const indexBlock = freeBlocks[0];

  // Chon data block tu cac block trong con lai
  const available = freeBlocks.slice(1);
  const dataBlocks = [];

  for (let i = 0; i < needed; i++) {
    const index = Math.floor(
      (i + 0.5) * available.length / needed
    );
    dataBlocks.push(available[index]);
  }

  const dataBlockIds = dataBlocks.map(block => block.id);

  // Luu bang dia chi vao index block
  indexBlock.status = "USED";
  indexBlock.fileId = file.id;
  indexBlock.kind = "INDEX";
  indexBlock.indexEntries = dataBlockIds;

  // Danh dau cac data block
  dataBlocks.forEach(block => {
    block.status = "USED";
    block.fileId = file.id;
    block.kind = "DATA";
  });

  file.allocationMethod = "INDEXED";
  file.indexBlock = indexBlock.id;
  file.dataBlocks = dataBlockIds;

  return {
    success: true,
    message: `Allocated 1 index block + ${needed} data blocks.`
  };
}
