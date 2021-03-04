#!/bin/bash

lxc delete mari -f
lxc launch ubuntu:20.04 mari

lxc exec mari -- cloud-init status -w
lxc exec mari -- /bin/bash -c "id -un 1000"
