
nano /etc/apt/sources.list
    deb http://download.virtualbox.org/virtualbox/debian focal contrib

wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | sudo apt-key add -

apt update && apt install linux-headers-$(uname -r) build-essential virtualbox-6.1 dkms

wget http://download.virtualbox.org/virtualbox/6.1.0/Oracle_VM_VirtualBox_Extension_Pack-6.1.0.vbox-extpack

VBoxManage extpack install Oracle_VM_VirtualBox_Extension_Pack-6.1.0-135406.vbox-extpack

adduser root vboxusers

mkdir -p ~/vbox/ISO
mv Oracle_VM_VirtualBox_Extension_Pack-6.1.0-135406.vbox-extpack vbox

## Get ISOs
mv Win10.iso ~/vbox/ISO

## Get ISOs
VBoxManage createvm --name "OpenTrends-CajaDeIngenieros" --ostype Windows10_64  --register

VBoxManage modifyvm "OpenTrends-CajaDeIngenieros" --memory 4096 --acpi on --boot1 dvd --nic1 nat

VBoxManage createhd --filename ~/VirtualBox\ VMs/OpenTrends-CajaDeIngenieros/OpenTrends-CajaDeIngenieros-0.vdi --size 20000

VBoxManage storagectl "OpenTrends-CajaDeIngenieros" --name "IDE Controller" --add ide --controller PIIX4

VBoxManage storageattach "OpenTrends-CajaDeIngenieros" --storagectl "IDE Controller" --port 0 --device 0 --type hdd --medium ~/VirtualBox\ VMs/OpenTrends-CajaDeIngenieros/OpenTrends-CajaDeIngenieros-0.vdi

VBoxManage storageattach "OpenTrends-CajaDeIngenieros" --storagectl "IDE Controller" --port 0 --device 1 --type dvddrive --medium ~/VirtualBox\ VMs/ISO/Win10_2004_EnglishInternational_x64.iso

VBoxManage modifyvm "OpenTrends-CajaDeIngenieros" --vrde on

VBoxHeadless --startvm "OpenTrends-CajaDeIngenieros" &

---

VBoxManage unregistervm "" --delete



--------------------------------------------------------------------------------------

apt install virtualbox virtualbox-dkms virtualbox-ext-pack virtualbox-guest-additions-iso virtualbox-guest-dkms virtualbox-guest-utils virtualbox-guest-x11

vboxmanage import w10.ova
```
Interpreting /root/w10.ova...
OK.
Disks:
  iso2	59760640	-1	http://www.ecma-international.org/publications/standards/Ecma-119.htm	w10-disk002.iso	-1	-1	
  vmdisk1	107374182400	-1	http://www.vmware.com/interfaces/specifications/vmdk.html#streamOptimized	w10-disk001.vmdk	-1	-1	

Virtual system 0:
 0: Suggested OS type: "Windows10_64"
    (change with "--vsys 0 --ostype <type>"; use "list ostypes" to list all possible values)
 1: Suggested VM name "w10"
    (change with "--vsys 0 --vmname <name>")
 2: Suggested VM group "/"
    (change with "--vsys 0 --group <group>")
 3: Suggested VM settings file name "/root/VirtualBox VMs/w10/w10.vbox"
    (change with "--vsys 0 --settingsfile <filename>")
 4: Suggested VM base folder "/root/VirtualBox VMs"
    (change with "--vsys 0 --basefolder <path>")
 5: Number of CPUs: 4
    (change with "--vsys 0 --cpus <n>")
 6: Guest memory: 8192 MB
    (change with "--vsys 0 --memory <MB>")
 7: Sound card (appliance expects "", can change on import)
    (disable with "--vsys 0 --unit 7 --ignore")
 8: USB controller
    (disable with "--vsys 0 --unit 8 --ignore")
 9: Network adapter: orig NAT, config 3, extra slot=0;type=NAT
10: CD-ROM
    (disable with "--vsys 0 --unit 10 --ignore")
11: SATA controller, type AHCI
    (disable with "--vsys 0 --unit 11 --ignore")
12: Hard disk image: source image=w10-disk002.iso, target path=w10-disk002_1.iso, controller=11;channel=1
    (change target path with "--vsys 0 --unit 12 --disk path";
    disable with "--vsys 0 --unit 12 --ignore")
13: Hard disk image: source image=w10-disk001.vmdk, target path=w10-disk001.vmdk, controller=11;channel=0
    (change target path with "--vsys 0 --unit 13 --disk path";
    disable with "--vsys 0 --unit 13 --ignore")
```


VBoxManage list vms
VBoxManage modifyvm "w10" --vrde off
VBoxManage modifyvm "w10" --vrdeproperty VNCPassword=hardapps123

VBoxHeadless -s "w10" 



VBoxManage modifyvm "OpenTrends-CajaDeIngenieros" --vrdeproperty VNCPassword=hardapps123

