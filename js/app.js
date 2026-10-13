import {

  createDisk,

  releaseFile,

  TOTAL_BLOCKS,

  BLOCK_SIZE_BYTES,

  POINTER_SIZE_BYTES,

  countFreeBlocks,

  getLargestContiguousFreeRegion

} from "./core/disk.js";


import {

  createFile,

  calculateStorageRequirement

} from "./core/file.js";


import {

  allocateContiguous

} from "./allocations/contiguous.js";


import {

  allocateLinked

} from "./allocations/linked.js";


import {

  allocateIndexed

} from "./allocations/indexed.js";



/*
  ==================================================
  TEST FILES
  ==================================================
*/

const TEST_FILES = [

  {
    id: "F01",
    name: "tiny.txt",
    sizeBytes: 1000
  },

  {
    id: "F02",
    name: "notes.txt",
    sizeBytes: 6100
  },

  {
    id: "F03",
    name: "report.docx",
    sizeBytes: 18500
  },

  {
    id: "F04",
    name: "diagram.png",
    sizeBytes: 20470
  },

  {
    id: "F05",
    name: "photo.jpg",
    sizeBytes: 52000
  },

  {
    id: "F06",
    name: "data.csv",
    sizeBytes: 33000
  },

  {
    id: "F07",
    name: "slides.pptx",
    sizeBytes: 88000
  },

  {
    id: "F08",
    name: "database.db",
    sizeBytes: 32768
  },

  {
    id: "F09",
    name: "video-clip.mp4",
    sizeBytes: 120000
  }

];



/*
  ==================================================
  FRAGMENTED DISK SCENARIO
  ==================================================

  These are actual simulated files.

  Each one already occupies a
  contiguous region.

  The gaps between files represent
  free regions created by previous
  file deletion / disk usage.

  Largest free region = 5 blocks.
*/

const SCENARIO_FILES = [

  {
    id: "S01",
    name: "assignment.pdf",
    startBlock: 0,
    endBlock: 7
  },

  {
    id: "S02",
    name: "project.zip",
    startBlock: 13,
    endBlock: 20
  },

  {
    id: "S03",
    name: "records.csv",
    startBlock: 26,
    endBlock: 34
  },

  {
    id: "S04",
    name: "presentation.pptx",
    startBlock: 40,
    endBlock: 47
  },

  {
    id: "S05",
    name: "images.zip",
    startBlock: 53,
    endBlock: 61
  },

  {
    id: "S06",
    name: "source-code.zip",
    startBlock: 67,
    endBlock: 74
  },

  {
    id: "S07",
    name: "lecture-notes.pdf",
    startBlock: 80,
    endBlock: 88
  },

  {
    id: "S08",
    name: "backup.dat",
    startBlock: 94,
    endBlock: 99
  }

];



/*
  ==================================================
  GLOBAL STATE
  ==================================================
*/

let disk =
  createDisk(TOTAL_BLOCKS);


let allocatedFiles = [];


let selectedBlockId = null;



/*
  ==================================================
  HTML ELEMENTS
  ==================================================
*/

const fileSelect =
  document.getElementById(
    "file-select"
  );


const fileInfo =
  document.getElementById(
    "file-info"
  );


const storageRequirement =
  document.getElementById(
    "storage-requirement"
  );


const allocateButton =
  document.getElementById(
    "allocate-button"
  );


const fragmentButton =
  document.getElementById(
    "fragment-button"
  );


const resetButton =
  document.getElementById(
    "reset-button"
  );


const allocationResult =
  document.getElementById(
    "allocation-result"
  );


const diskContainer =
  document.getElementById(
    "disk-container"
  );


const diskStats =
  document.getElementById(
    "disk-stats"
  );


const bitmap =
  document.getElementById(
    "bitmap"
  );


const blockDetails =
  document.getElementById(
    "block-details"
  );


const fcbPanel =
  document.getElementById(
    "fcb-panel"
  );


const fileList =
  document.getElementById(
    "file-list"
  );



/*
  ==================================================
  FILE SELECT
  ==================================================
*/

function populateFileSelect() {

  TEST_FILES.forEach((file) => {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      file.id;


    option.textContent =
      `${file.name} (${file.sizeBytes} bytes)`;


    fileSelect.appendChild(
      option
    );

  });

}



function getSelectedFileDefinition() {

  return TEST_FILES.find(

    (file) =>
      file.id ===
      fileSelect.value

  );

}



function getSelectedMethod() {

  const selected =
    document.querySelector(
      'input[name="allocation-method"]:checked'
    );


  return selected.value;

}



function showSelectedFileInfo() {

  const definition =
    getSelectedFileDefinition();


  fileInfo.textContent =
    `File ID: ${definition.id}
File name: ${definition.name}
File size: ${definition.sizeBytes} bytes`;

}



/*
  ==================================================
  STORAGE REQUIREMENT
  ==================================================
*/

function showStorageRequirement() {

  const definition =
    getSelectedFileDefinition();


  const file =
    createFile(definition);


  const method =
    getSelectedMethod();


  const requirement =
    calculateStorageRequirement(

      file,

      method,

      BLOCK_SIZE_BYTES,

      POINTER_SIZE_BYTES

    );


  let text =
    `Method: ${method}
File size: ${file.sizeBytes} bytes
Block size: ${BLOCK_SIZE_BYTES} bytes`;


  if (
    method === "CONTIGUOUS"
  ) {

    text +=
      `
Usable data/block: ${BLOCK_SIZE_BYTES} bytes
Data blocks required: ${requirement.requiredDataBlocks}
Physical blocks required: ${requirement.totalPhysicalBlocks}`;

  }


  if (
    method === "LINKED"
  ) {

    text +=
      `
Pointer size: ${POINTER_SIZE_BYTES} bytes
Usable data/block: ${requirement.usableBytesPerDataBlock} bytes
Data blocks required: ${requirement.requiredDataBlocks}
Physical blocks required: ${requirement.totalPhysicalBlocks}`;

  }


  if (
    method === "INDEXED"
  ) {

    text +=
      `
Data blocks required: ${requirement.requiredDataBlocks}
Index blocks required: ${requirement.indexBlocks}
Physical blocks required: ${requirement.totalPhysicalBlocks}`;

  }


  storageRequirement.textContent =
    text;

}



/*
  ==================================================
  ALLOCATION
  ==================================================
*/

function allocateSelectedFile() {

  const definition =
    getSelectedFileDefinition();


  const alreadyExists =
    allocatedFiles.some(

      (file) =>
        file.id ===
        definition.id

    );


  if (alreadyExists) {

    showSimpleFailure(
      `${definition.name} is already allocated.`
    );

    return;

  }


  const file =
    createFile(definition);


  const method =
    getSelectedMethod();


  const requirement =
    calculateStorageRequirement(

      file,

      method,

      BLOCK_SIZE_BYTES,

      POINTER_SIZE_BYTES

    );


  let result;


  if (
    method === "CONTIGUOUS"
  ) {

    result =
      allocateContiguous(
        file,
        disk,
        requirement
      );

  }


  else if (
    method === "LINKED"
  ) {

    result =
      allocateLinked(
        file,
        disk,
        requirement
      );

  }


  else {

    result =
      allocateIndexed(
        file,
        disk,
        requirement
      );

  }


  showAllocationResult(
    result,
    file,
    requirement
  );


  if (
    !result.success
  ) {

    return;

  }


  allocatedFiles.push(
    file
  );


  renderEverything();


  renderFCB(file);

}



/*
  ==================================================
  RESULT
  ==================================================
*/

function showAllocationResult(
  result,
  file,
  requirement
) {

  allocationResult.className =
    "result-box";


  if (result.success) {

    allocationResult.classList.add(
      "result-success"
    );


    allocationResult.textContent =
      `ALLOCATION SUCCESS
File: ${file.name}
Method: ${result.method}
Data blocks: ${requirement.requiredDataBlocks}
Physical blocks used: ${requirement.totalPhysicalBlocks}`;


    return;

  }


  allocationResult.classList.add(
    "result-fail"
  );


  let text =
    `ALLOCATION FAILED
File: ${file.name}
Method: ${result.method}`;


  if (
    result.method ===
    "CONTIGUOUS"
  ) {

    text +=
      `
Required blocks: ${result.requiredBlocks}
Free blocks: ${result.freeBlocks}
Largest contiguous region: ${result.largestContiguousRegion}
No suitable contiguous region. Disk unchanged.`;

  }


  if (
    result.method ===
    "LINKED"
  ) {

    text +=
      `
Required blocks: ${result.requiredBlocks}
Free blocks: ${result.freeBlocks}
Not enough free blocks. Disk unchanged.`;

  }


  if (
    result.method ===
    "INDEXED"
  ) {

    text +=
      `
Data blocks required: ${result.requiredDataBlocks}
Index blocks required: ${result.indexBlocks}
Total blocks required: ${result.totalRequiredBlocks}
Free blocks: ${result.freeBlocks}
Not enough free blocks. Disk unchanged.`;

  }


  allocationResult.textContent =
    text;

}



function showSimpleFailure(text) {

  allocationResult.className =
    "result-box result-fail";


  allocationResult.textContent =
    `ALLOCATION FAILED
${text}`;

}



/*
  ==================================================
  DISK
  ==================================================
*/

function renderDisk() {

  diskContainer.innerHTML =
    "";


  disk.forEach((block) => {

    const blockElement =
      document.createElement(
        "div"
      );


    blockElement.className =
      "disk-block";


    if (
      block.id ===
      selectedBlockId
    ) {

      blockElement.classList.add(
        "selected"
      );

    }


    if (
      block.status === "USED"
    ) {

      if (
        block.allocationMethod ===
        "CONTIGUOUS"
      ) {

        blockElement.classList.add(
          "block-contiguous"
        );

      }


      if (
        block.allocationMethod ===
        "LINKED"
      ) {

        blockElement.classList.add(
          "block-linked"
        );

      }


      if (
        block.allocationMethod ===
        "INDEXED"
      ) {

        if (
          block.kind === "INDEX"
        ) {

          blockElement.classList.add(
            "block-index"
          );

        }

        else {

          blockElement.classList.add(
            "block-indexed"
          );

        }

      }

    }


    const idLabel =
      document.createElement(
        "span"
      );


    idLabel.className =
      "block-id";


    idLabel.textContent =
      block.id;


    const ownerLabel =
      document.createElement(
        "span"
      );


    ownerLabel.className =
      "block-owner";


    ownerLabel.textContent =
      block.fileId ?? "FREE";


    blockElement.appendChild(
      idLabel
    );


    blockElement.appendChild(
      ownerLabel
    );


    blockElement.addEventListener(
      "click",
      () =>
        selectBlock(block.id)
    );


    diskContainer.appendChild(
      blockElement
    );

  });

}



/*
  ==================================================
  BLOCK DETAILS
  ==================================================
*/

function selectBlock(blockId) {

  selectedBlockId =
    blockId;


  const block =
    disk[blockId];


  renderBlockDetails(
    block
  );


  /*
    If this block belongs to a file,
    show that file's FCB.
  */

  if (
    block.fileId !== null
  ) {

    const file =
      allocatedFiles.find(

        (item) =>
          item.id ===
          block.fileId

      );


    if (file) {

      renderFCB(file);

    }

  }

  else {

    fcbPanel.textContent =
      "This block is FREE and does not belong to a file.";

  }


  renderDisk();

}



function renderBlockDetails(block) {

  let text =
    `Block ID: ${block.id}
Status: ${block.status}`;


  if (
    block.status === "FREE"
  ) {

    blockDetails.textContent =
      text;

    return;

  }


  const file =
    allocatedFiles.find(

      (item) =>
        item.id ===
        block.fileId

    );


  text +=
    `
File ID: ${block.fileId}
File name: ${file?.name ?? "Unknown"}
Block type: ${block.kind}
Method: ${block.allocationMethod}`;


  if (
    block.nextBlock !== null
  ) {

    text +=
      `
Next block: ${block.nextBlock}`;

  }


  if (
    block.kind === "INDEX"
  ) {

    text +=
      `
Index entries: ${block.indexEntries.join(", ")}`;

  }


  blockDetails.textContent =
    text;

}



/*
  ==================================================
  DISK STATS
  ==================================================
*/

function renderDiskStats() {

  const used =
    disk.filter(

      (block) =>
        block.status === "USED"

    ).length;


  const free =
    TOTAL_BLOCKS - used;


  const largestRegion =
    getLargestContiguousFreeRegion(
      disk
    );


  diskStats.textContent =
    `Total blocks: ${TOTAL_BLOCKS}
Block size: ${BLOCK_SIZE_BYTES} bytes
Disk capacity: ${TOTAL_BLOCKS * BLOCK_SIZE_BYTES} bytes
Used blocks: ${used}
Free blocks: ${free}
Largest contiguous free region: ${largestRegion} blocks`;

}



/*
  ==================================================
  FREE-SPACE BITMAP
  ==================================================
*/

function renderFreeSpaceBitmap() {

  const bits =
    disk.map(

      (block) =>
        block.status === "FREE"
          ? "1"
          : "0"

    );


  const rows = [];


  for (
    let i = 0;
    i < bits.length;
    i += 20
  ) {

    rows.push(

      bits
        .slice(i, i + 20)
        .join(" ")

    );

  }


  bitmap.textContent =
    rows.join("\n");

}



/*
  ==================================================
  FILE CONTROL BLOCK
  ==================================================
*/

function renderFCB(file) {

  let text =
    `File ID: ${file.id}
File name: ${file.name}
File size: ${file.sizeBytes} bytes
Allocation method: ${file.allocationMethod}`;


  if (
    file.allocationMethod ===
    "CONTIGUOUS"
  ) {

    text +=
      `
Start block: ${file.startBlock}
Length: ${file.requiredDataBlocks} blocks`;

  }


  if (
    file.allocationMethod ===
    "LINKED"
  ) {

    text +=
      `
First block: ${file.startBlock}
Last block: ${file.endBlock}`;

  }


  if (
    file.allocationMethod ===
    "INDEXED"
  ) {

    text +=
      `
Index block: ${file.indexBlock}`;

  }


  fcbPanel.textContent =
    text;

}



/*
  ==================================================
  FILE LIST
  ==================================================
*/

function renderFileList() {

  fileList.innerHTML =
    "";


  if (
    allocatedFiles.length === 0
  ) {

    fileList.textContent =
      "No files allocated yet.";

    return;

  }


  allocatedFiles.forEach(
    (file) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "file-row";


      const text =
        document.createElement(
          "div"
        );


      text.className =
        "file-info-line";


      text.textContent =
        `${file.id} — ${file.name}
${file.allocationMethod} — ${file.totalPhysicalBlocks} block(s)`;


      const deleteButton =
        document.createElement(
          "button"
        );


      deleteButton.className =
        "delete-button";


      deleteButton.textContent =
        "Delete";


      deleteButton.addEventListener(
        "click",
        () =>
          deleteFile(file.id)
      );


      row.appendChild(
        text
      );


      row.appendChild(
        deleteButton
      );


      fileList.appendChild(
        row
      );

    }
  );

}



/*
  ==================================================
  DELETE
  ==================================================
*/

function deleteFile(fileId) {

  const file =
    allocatedFiles.find(

      (item) =>
        item.id === fileId

    );


  releaseFile(
    disk,
    fileId
  );


  allocatedFiles =
    allocatedFiles.filter(

      (item) =>
        item.id !== fileId

    );


  selectedBlockId =
    null;


  allocationResult.className =
    "result-box";


  allocationResult.textContent =
    `File deleted: ${file?.name ?? fileId}
Released blocks are now FREE.`;


  blockDetails.textContent =
    "Click a block to inspect it.";


  fcbPanel.textContent =
    "No file selected.";


  renderEverything();

}



/*
  ==================================================
  FRAGMENTED DISK
  ==================================================
*/

function loadFragmentedDisk() {

  disk =
    createDisk(
      TOTAL_BLOCKS
    );


  allocatedFiles = [];


  selectedBlockId =
    null;


  SCENARIO_FILES.forEach(
    (definition) => {

      addScenarioFile(
        definition
      );

    }
  );


  allocationResult.className =
    "result-box";


  allocationResult.textContent =
    `FRAGMENTED DISK LOADED
Files on disk: ${SCENARIO_FILES.length}
Free blocks: ${countFreeBlocks(disk)}
Largest contiguous free region: ${getLargestContiguousFreeRegion(disk)} blocks`;


  blockDetails.textContent =
    "Click a block to inspect it.";


  fcbPanel.textContent =
    "Select a used block to view its file metadata.";


  renderEverything();

}



/*
  Add one real simulated file
  into the fragmented disk snapshot.
*/

function addScenarioFile(
  definition
) {

  const blockCount =
    definition.endBlock -
    definition.startBlock +
    1;


  const dataBlocks = [];


  for (
    let i =
      definition.startBlock;

    i <=
      definition.endBlock;

    i++
  ) {

    disk[i].status =
      "USED";

    disk[i].fileId =
      definition.id;

    disk[i].allocationMethod =
      "CONTIGUOUS";

    disk[i].kind =
      "DATA";


    dataBlocks.push(i);

  }


  const file = {

    id:
      definition.id,

    name:
      definition.name,

    sizeBytes:
      blockCount *
      BLOCK_SIZE_BYTES,

    allocationMethod:
      "CONTIGUOUS",

    requiredDataBlocks:
      blockCount,

    totalPhysicalBlocks:
      blockCount,

    usableBytesPerDataBlock:
      BLOCK_SIZE_BYTES,

    startBlock:
      definition.startBlock,

    endBlock:
      definition.endBlock,

    indexBlock:
      null,

    dataBlocks:
      dataBlocks

  };


  allocatedFiles.push(
    file
  );

}



/*
  ==================================================
  RESET
  ==================================================
*/

function resetSimulator() {

  disk =
    createDisk(
      TOTAL_BLOCKS
    );


  allocatedFiles = [];


  selectedBlockId =
    null;


  allocationResult.className =
    "result-box";


  allocationResult.textContent =
    "Simulator reset.";


  blockDetails.textContent =
    "Click a block to inspect it.";


  fcbPanel.textContent =
    "No file selected.";


  renderEverything();

}



/*
  ==================================================
  RENDER
  ==================================================
*/

function renderEverything() {

  renderDisk();

  renderDiskStats();

  renderFreeSpaceBitmap();

  renderFileList();

}



/*
  ==================================================
  EVENTS
  ==================================================
*/

fileSelect.addEventListener(
  "change",
  () => {

    showSelectedFileInfo();

    showStorageRequirement();

  }
);


document
  .querySelectorAll(
    'input[name="allocation-method"]'
  )
  .forEach((radio) => {

    radio.addEventListener(
      "change",
      showStorageRequirement
    );

  });


allocateButton.addEventListener(
  "click",
  allocateSelectedFile
);


fragmentButton.addEventListener(
  "click",
  loadFragmentedDisk
);


resetButton.addEventListener(
  "click",
  resetSimulator
);



/*
  ==================================================
  INITIALIZE
  ==================================================
*/

populateFileSelect();

showSelectedFileInfo();

showStorageRequirement();

renderEverything();
