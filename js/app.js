import {

  createDisk,

  releaseFile,

  createFragmentationScenario,

  TOTAL_BLOCKS,

  BLOCK_SIZE_BYTES,

  POINTER_SIZE_BYTES

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
  --------------------------------------------------
  TEST FILES
  --------------------------------------------------

  These are simulated files.

  Their sizes are stored in bytes.

  Some files are intentionally larger
  so they can be used for allocation
  failure demonstrations.
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
    name: "boundary-test.bin",
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
    name: "large-test.bin",
    sizeBytes: 32768
  },

  {
    id: "F09",
    name: "very-large-test.bin",
    sizeBytes: 120000
  }

];



/*
  --------------------------------------------------
  GLOBAL STATE
  --------------------------------------------------
*/

let disk =
  createDisk(TOTAL_BLOCKS);


let allocatedFiles = [];



/*
  --------------------------------------------------
  HTML ELEMENTS
  --------------------------------------------------
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


const fcbPanel =
  document.getElementById(
    "fcb-panel"
  );


const fileList =
  document.getElementById(
    "file-list"
  );



/*
  --------------------------------------------------
  FILE SELECT
  --------------------------------------------------
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
Logical file size: ${definition.sizeBytes} bytes`;

}



/*
  --------------------------------------------------
  STORAGE REQUIREMENT
  --------------------------------------------------
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

Usable data per block: ${BLOCK_SIZE_BYTES} bytes
Required data blocks: ${requirement.requiredDataBlocks}
Total physical blocks required: ${requirement.totalPhysicalBlocks}`;

  }


  if (
    method === "LINKED"
  ) {

    text +=
      `

Pointer size: ${POINTER_SIZE_BYTES} bytes
Usable data per block: ${requirement.usableBytesPerDataBlock} bytes

Required data blocks:
ceil(${file.sizeBytes} / ${requirement.usableBytesPerDataBlock})
= ${requirement.requiredDataBlocks}

Total physical blocks required:
${requirement.totalPhysicalBlocks}`;

  }


  if (
    method === "INDEXED"
  ) {

    text +=
      `

Required data blocks: ${requirement.requiredDataBlocks}
Index blocks required: ${requirement.indexBlocks}

Total physical blocks required:
${requirement.totalPhysicalBlocks}`;

  }


  storageRequirement.textContent =
    text;

}



/*
  --------------------------------------------------
  ALLOCATION
  --------------------------------------------------
*/

function allocateSelectedFile() {

  const definition =
    getSelectedFileDefinition();


  /*
    Prevent the same test file
    from being allocated twice.
  */

  const alreadyExists =
    allocatedFiles.some(

      (file) =>
        file.id ===
        definition.id

    );


  if (alreadyExists) {

    showFailureMessage(
      `File ${definition.name} is already allocated.`
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


  renderFCB(
    file
  );

}



/*
  --------------------------------------------------
  SUCCESS / FAILURE RESULT
  --------------------------------------------------
*/

function showAllocationResult(
  result,
  file,
  requirement
) {

  allocationResult.className =
    "result-box";


  /*
    SUCCESS
  */

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


  /*
    FAILURE
  */

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

Required contiguous blocks:
${result.requiredBlocks}

Total free blocks:
${result.freeBlocks}

Largest contiguous free region:
${result.largestContiguousRegion}

Reason:
${result.reason}

Disk state was not changed.`;

  }


  if (
    result.method ===
    "LINKED"
  ) {

    text +=
      `

Required data blocks:
${result.requiredBlocks}

Available free blocks:
${result.freeBlocks}

Reason:
${result.reason}

Disk state was not changed.`;

  }


  if (
    result.method ===
    "INDEXED"
  ) {

    text +=
      `

Required data blocks:
${result.requiredDataBlocks}

Index blocks:
${result.indexBlocks}

Total required blocks:
${result.totalRequiredBlocks}

Available free blocks:
${result.freeBlocks}

Reason:
${result.reason}

Disk state was not changed.`;

  }


  allocationResult.textContent =
    text;

}



function showFailureMessage(text) {

  allocationResult.className =
    "result-box result-fail";


  allocationResult.textContent =
    text;

}



/*
  --------------------------------------------------
  VIRTUAL DISK
  --------------------------------------------------
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


    /*
      Color depending on method.
    */

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


      if (
        block.allocationMethod ===
        "SCENARIO"
      ) {

        blockElement.classList.add(
          "block-scenario"
        );

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


    /*
      Tooltip
    */

    let tooltip =
      `Block ${block.id}
Status: ${block.status}`;


    if (
      block.status === "USED"
    ) {

      tooltip +=
        `\nOwner: ${block.fileId}`;

      tooltip +=
        `\nMethod: ${block.allocationMethod}`;

      tooltip +=
        `\nType: ${block.kind}`;

    }


    if (
      block.nextBlock !== null
    ) {

      tooltip +=
        `\nNext block: ${block.nextBlock}`;

    }


    if (
      block.kind === "INDEX"
    ) {

      tooltip +=
        `\nIndex entries: ${block.indexEntries.join(", ")}`;

    }


    blockElement.title =
      tooltip;


    diskContainer.appendChild(
      blockElement
    );

  });

}



/*
  --------------------------------------------------
  DISK STATS
  --------------------------------------------------
*/

function renderDiskStats() {

  const used =
    disk.filter(

      (block) =>
        block.status === "USED"

    ).length;


  const free =
    TOTAL_BLOCKS - used;


  diskStats.textContent =
    `Total blocks: ${TOTAL_BLOCKS}
Block size: ${BLOCK_SIZE_BYTES} bytes

Virtual disk capacity:
${TOTAL_BLOCKS * BLOCK_SIZE_BYTES} bytes

Used blocks: ${used}
Free blocks: ${free}`;

}



/*
  --------------------------------------------------
  FREE-SPACE BITMAP
  --------------------------------------------------

  Following the simulator convention:

  1 = FREE
  0 = USED
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
  --------------------------------------------------
  FILE CONTROL BLOCK
  --------------------------------------------------
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
  --------------------------------------------------
  FILE LIST
  --------------------------------------------------
*/

function renderFileList() {

  fileList.innerHTML =
    "";


  if (
    allocatedFiles.length === 0
  ) {

    fileList.textContent =
      "No user files allocated yet.";

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
        `${file.name}
${file.allocationMethod}
${file.totalPhysicalBlocks} physical block(s)`;


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
  --------------------------------------------------
  DELETE FILE
  --------------------------------------------------
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


  allocationResult.className =
    "result-box";


  allocationResult.textContent =
    `File ${file?.name ?? fileId} deleted.

Its blocks were released.`;


  fcbPanel.textContent =
    "No allocated file selected.";


  renderEverything();

}



/*
  --------------------------------------------------
  FRAGMENTATION SCENARIO
  --------------------------------------------------
*/

function loadFragmentationScenario() {

  disk =
    createDisk(
      TOTAL_BLOCKS
    );


  allocatedFiles = [];


  createFragmentationScenario(
    disk
  );


  allocationResult.className =
    "result-box";


  allocationResult.textContent =
    `Fragmentation scenario loaded.

The disk still contains free blocks,
but the free space is divided into
small non-contiguous regions.

Try allocating a larger test file
with different allocation methods.`;


  fcbPanel.textContent =
    "No allocated file selected.";


  renderEverything();

}



/*
  --------------------------------------------------
  RESET
  --------------------------------------------------
*/

function resetSimulator() {

  disk =
    createDisk(
      TOTAL_BLOCKS
    );


  allocatedFiles = [];


  allocationResult.className =
    "result-box";


  allocationResult.textContent =
    "Simulator reset.";


  fcbPanel.textContent =
    "No allocated file selected.";


  renderEverything();

}



/*
  --------------------------------------------------
  RENDER ALL
  --------------------------------------------------
*/

function renderEverything() {

  renderDisk();

  renderDiskStats();

  renderFreeSpaceBitmap();

  renderFileList();

}



/*
  --------------------------------------------------
  EVENTS
  --------------------------------------------------
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
  loadFragmentationScenario
);


resetButton.addEventListener(
  "click",
  resetSimulator
);



/*
  --------------------------------------------------
  INITIALIZE
  --------------------------------------------------
*/

populateFileSelect();

showSelectedFileInfo();

showStorageRequirement();

renderEverything();
