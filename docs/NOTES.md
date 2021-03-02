## API - LXD

-   Location: /var/snap/lxd/common/lxd/unix.socket
-   Example:

```
$: curl --unix-socket /var/snap/lxd/common/lxd/unix.socket s/1.0/images
{
    "type":"sync",
    "status":"Success",
    "status_code":200,
    "operation":"",
    "error_code":0,
    "error":"",
    "metadata":
    ["/1.0/images/b9e93652ee67612114951d910acc4fd6fce0473f8dc0bf562c602e997fcb4857"]
}
```
