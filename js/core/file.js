// File model
// File model
export function createFile(fileDefinition, blockSizeBytes = 4096) {
  const requiredDataBlocks = Math.ceil(
    fileDefinition.sizeBytes / blockSizeBytes
  );

  return {
    id: fileDefinition.id,
    name: fileDefinition.name,

    // Kích thước thật của file mô phỏng
    sizeBytes: fileDefinition.sizeBytes,

    // File System block size
    blockSizeBytes: blockSizeBytes,

    // Số DATA block cần thiết
    requiredDataBlocks: requiredDataBlocks,

    // Chưa allocation
    allocationMethod: null,

    // Các trường sau sẽ được thuật toán điền
    startBlock: null,
    endBlock: null,
    indexBlock: null,
    dataBlocks: []
  };
}
