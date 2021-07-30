const fs = require("fs")
const path = require("path")
const child_process = require("child_process")

const COMPILER_PATH = "b4c"
const SPECIAL_CHAR_REMOVE_REGEX = /[^A-Z0-9]+/ig
const APPS_DIR = "apps"
const BOOT_DIR = "boot"
const EXAMPLE_APP = "example_app"
const APP_EXTENSIONS_REGEX = /\.(b4|asm|bin)$/

const BOOTLOADER_SIZE = 256
const SECTOR_SIZE = 4096
const LAUNCHER_SIZE = 3072

function load_app(dir) {
  console.log(`${dir}:`)

  let info
  let type
  let source

  fs.readdirSync(dir, {withFileTypes:true}).forEach(file => {
    let content = fs.readFileSync(path.join(dir, file.name))

    if (file.name === "info.json") {
      info = JSON.parse(content)
    } else {
      let result = APP_EXTENSIONS_REGEX.exec(file.name)
      if (result !== null) {
        type = result[1]
        source = content.toString()
      }
    }
  })

  if (info === undefined || source === undefined) {
    throw new Error(`Could not load source file and info.json for '${dir}'`)
  }

  console.log(`          Name - ${info.name}`)
  console.log(`       Version - ${info.version}`)
  console.log(`   Source Type - ${type}`)

  let binary = get_binary(source, type)

  let app = {
    name: info.name,
    size: binary.length,
    binary: binary
  }

  console.log(`  Size (words) - ${app.size}`)
  console.log(`  Size (bytes) - ${app.size * 2}\n`)

  return app
}

function get_apps() {
  let apps = []

  fs.readdirSync(APPS_DIR).forEach(dir => {
    if (dir !== EXAMPLE_APP) {
      let app_dir = path.join(APPS_DIR, dir)
      apps.push(load_app(app_dir))
    }
  })

  return apps
}

function get_bootloader() {
  let bootloader = load_app(path.join(BOOT_DIR, "bootloader"))

  if (bootloader.size > BOOTLOADER_SIZE) {
    throw Error(`Bootloader is too large (${bootloader.size} > ${BOOTLOADER_SIZE})`)
  }

  return bootloader
}

function get_launcher() {
  let launcher = load_app(path.join(BOOT_DIR, "launcher"))

  if (launcher.size > LAUNCHER_SIZE) {
    throw Error(`Launcher is too large (${launcher.size} > ${LAUNCHER_SIZE})`)
  }

  return launcher
}

function compile(input) {
  let result = child_process.spawnSync(COMPILER_PATH, ["-ca","-q", "-o", "-", "-"], {shell:true,input:input})

  if (result.error) {
    throw result.error
  } else if (result.status !== 0) {
    throw new Error(`Failed to compile program:\n${result.stderr.toString()}`)
  }

  return result.stdout.toString()
}

function assemble(input) {
  let result = child_process.spawnSync(COMPILER_PATH, ["-a","-q", "-o", "-", "-"], {shell:true,input:input})

  if (result.error) {
    throw result.error
  } else if (result.status !== 0) {
    throw new Error(`Failed to assemble program:\n${result.stderr.toString()}`)
  }

  return result.stdout.toString()
}

function get_binary(source, type) {
  let binary_string
  switch (type) {
    case "b4":
      binary_string = compile(source)
      break
    case "asm":
      binary_string = assemble(source)
      break
    case "bin":
      binary_string = source
      break
    default:
      throw Error(`Unknown app type '${type}'`)
  }

  return binary_string.trim().split("\n")
}

function compiler_test() {
  try {
    compile("include *")
  } catch (error) {
    console.error("The compiler self-test has failed, bad path or broken compiler?")
    console.error(`Path: ${COMPILER_PATH}\n`)
    console.error(error.toString())
    process.exit(1)
  }
}

function pad(data, size) {
  let diff = size - data.length

  for (let i = 0; i < diff; i++) {
    data.push("0")
  }

  if (diff < 0) {
    throw new Error(`Unable to pad input data to ${size} words, as data is ${data} words`)
  }

  return data
}

function generate_table_entry(program, location) {
  let upper_location = (location & 0x70000) >> 16
  let lower_location = location & 0xffff

  let sanitised_name = program.name.replace(SPECIAL_CHAR_REMOVE_REGEX, "_").toLowerCase()

  let entry = [
    `~${sanitised_name}_str`, // relative jump to name string
    `${program.size}`,        // program size in words
    `${upper_location}`,      // location, upper 3 bits
    `${lower_location}`       // location, lower 16 bits
  ]

  let extra_data = [
    `${sanitised_name}_str:`
  ]

  let ascii_name = []
  for (let char of program.name) {
    let code = char.charCodeAt(0)

    if (code > 0 && code < 128) {
      ascii_name.push(`${code}`)
    } else {
      throw new Error(`Character '${char}' (${code}) is out of ASCII range`)
    }
  }
  ascii_name.push(`0`)
  extra_data.push(...ascii_name)

  return [entry, extra_data]
}

function convert_to_base64(image) {
  let as_bytes = []

  for (let word of image) {
    let value = parseInt(word, 2)
    let [high, low] = [value >> 8, value & 0xff]
    as_bytes.push(high)
    as_bytes.push(low)
  }

  let as_ascii = ""
  for (let byte of as_bytes) {
    as_ascii += String.fromCharCode(byte)
  }

  return Buffer.from(as_ascii, "ascii").toString("base64")
}

compiler_test()

console.log("=== Building boot sector ===\n")
let bootloader = get_bootloader()
let launcher = get_launcher()

let image = []
image.push(...pad(bootloader.binary, BOOTLOADER_SIZE))
image.push(...pad(launcher.binary, SECTOR_SIZE - BOOTLOADER_SIZE))

console.log("=== Loading apps ===\n")
let apps = get_apps()

if (apps.length === 0) {
  console.warn(`No apps found, read files in ${APPS_DIR}/${EXAMPLE_APP} to learn how to add them\n`)
}

let app_data = []
let location = SECTOR_SIZE * 2
let table_entries = []
let table_data = []

for (let app of apps) {
  let [entry, data] = generate_table_entry(app, location)
  table_entries.push(...entry)
  table_data.push(...data)
  app_data.push(...app.binary)
  location += app.size
}

console.log("=== Generating descriptor table ===\n")
let table = []
table.push(apps.length.toString())
table.push(...table_entries)
table.push(...table_data)

let assembled_table = assemble(table.join("\n")).split("\n")

image.push(...pad(assembled_table, SECTOR_SIZE))
image.push(...app_data)

console.log(`Apps:`)
console.log(apps.map(app => ` - ${app.name}`).join("\n"))

console.log(`\nImage:`)
console.log(` - ${image.length} words`)
console.log(` - ${((image.length * 2) / 1024).toFixed(2)} kilobytes`)
console.log(` - ${Math.ceil(image.length / SECTOR_SIZE)} sectors`)

fs.writeFileSync("out.bin", image.join("\n"))
fs.writeFileSync("out.base64", convert_to_base64(image))
