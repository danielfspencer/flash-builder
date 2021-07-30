call ~func__main ram.0

func__main:
  // clear screen
  write vram.0 sp+2
  for_0___main_start:
  write [sp+2] alu.1
  write vram.1023 alu.2
  goto ~for_0___main_end [alu.<]
    write 0 [sp+2]
  write [sp+2] alu.1
  write 1 alu.2
  write [alu.+] sp+2
  goto ~for_0___main_start 0
  for_0___main_end:
  // logo
  write 0b0000001111111111 vram.434
  write 0b1111111111111111 vram.435
  write 0b1111111111111111 vram.436
  write 0b1111111100000000 vram.437
  write 0b0000001111111111 vram.442
  write 0b1111111111111111 vram.443
  write 0b1111111111111111 vram.444
  write 0b1111111100000000 vram.445
  write 0b0000001101111101 vram.450
  write 0b0111111111111111 vram.451
  write 0b1111111111110111 vram.452
  write 0b1110011100000000 vram.453
  write 0b0000001101111101 vram.458
  write 0b1100000100000110 vram.459
  write 0b0011010011110111 vram.460
  write 0b1101011100000000 vram.461
  write 0b0000001100001101 vram.466
  write 0b0111101111101111 vram.467
  write 0b1101001110000111 vram.468
  write 0b1011011100000000 vram.469
  write 0b0000001101110101 vram.474
  write 0b0111011111011110 vram.475
  write 0b0001011101110111 vram.476
  write 0b1000001100000000 vram.477
  write 0b0000001101110101 vram.482
  write 0b0110111110111101 vram.483
  write 0b1101011101110111 vram.484
  write 0b1111011100000000 vram.485
  write 0b0000001100001101 vram.490
  write 0b0100000100000110 vram.491
  write 0b0001011110000111 vram.492
  write 0b1111011100000000 vram.493
  write 0b0000001111111111 vram.498
  write 0b1111111111111111 vram.499
  write 0b1111111111111111 vram.500
  write 0b1111111000000000 vram.501
  write 0b0000001111111111 vram.506
  write 0b1111111111111111 vram.507
  write 0b1111111111111111 vram.508
  write 0b1111110000000000 vram.509
  write 0b0000000000000000 sp+3
  write 0b0000000100000000 sp+4
  write ram.46079 sp+5
  write [sp+5] alu.1
  write 3072 alu.2
  write [alu.+] sp+6
  while_0___main_start:
  write [sp+5] alu.1
  write [sp+6] alu.2
  goto ~while_0___main_end [alu.<]
    write [sp+3] 8194
    write [sp+4] 8193
    copy 8192 [sp+5]
    write [sp+3] sp+9
    write [sp+4] sp+10
    write 0b0000000000000000 sp+11
    write 0b0000000000000001 sp+12
    call ~func_sys.u32_add_2 sp+7
    write [sp+13] sp+3
    write [sp+14] sp+4
    write [sp+5] alu.1
    write 1 alu.2
    write [alu.+] sp+5
  goto ~while_0___main_start 0
  while_0___main_end:
  goto ram.46079 0

func_sys.u32_add:
  func_sys.u32_add_1:
  func_sys.u32_add_2:
  write [sp+3] alu.1
  write [sp+5] alu.2
  write [alu.+] sp+7
  write [alu.ov] sp+8
  write [sp+2] alu.1
  write [sp+4] alu.2
  write [alu.+] sp+6
  write [sp+6] alu.1
  write [sp+8] alu.2
  write [alu.+] sp+6
  return [sp+0] [sp+1]

data:
