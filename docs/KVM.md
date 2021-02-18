# INSTALL
> https://vorkbaard.nl/windows-server-2019-windows-10-vm-on-qemu-kvm-on-ubuntu-18-04/

## INSTALL

```
sudo apt-get install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils

#    exit and relogin to update path

kvm-ok  
    INFO: /dev/kvm exists
    KVM acceleration can be used


sudo adduser `id -un` libvirt
sudo adduser `id -un` kvm

#    exit and relogin to update path

systemctl enable libvirtd
systemctl start libvirtd                                                                           
systemctl status libvirtd                                                                           
                                 
virsh list --all

```

### Locale error

```
nano /etc/default/Locale
    LANGUAGE=en_US.UTF-8
    LANG=en_US.UTF-8
    LC_ALL=en_US.UTF-8

locale-gen en_US.UTF-8
```

## ISO

Get Windows 10 ISO, you can download them from Microsoft for free and try them for 180 days. Good enough for a test lab.
The virtio driver iso, https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/virtio-win.iso.

## Setup Network

