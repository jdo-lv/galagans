# PlatformIO pre-build script: the first build copies include/config.example.h to include/config.h,
# so a fresh checkout builds straight away in dev mode. config.h is git-ignored; edit it, never the example.
import os
import shutil

Import("env")  # noqa: F821 (provided by PlatformIO)

include_dir = os.path.join(env.subst("$PROJECT_DIR"), "include")  # noqa: F821
config = os.path.join(include_dir, "config.h")
if not os.path.exists(config):
    shutil.copyfile(os.path.join(include_dir, "config.example.h"), config)
    print("Created include/config.h from config.example.h (DEV_MODE = true). Edit it to use Wi-Fi and the server.")
