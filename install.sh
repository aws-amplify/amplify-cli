#!/bin/sh

set -e

reset="\033[0m"
red="\033[31m"
green="\033[32m"
yellow="\033[33m"
cyan="\033[36m"
white="\033[37m"

printf "\n$yellow Installing Amplify CLI!$reset\n\n"

# Detect platform
if [[ $OSTYPE == "linux-gnu" ]]; then
  PLATFORM="linux"
elif [[ $OSTYPE == "darwin"* ]]; then
  PLATFORM="macos"
else
  echo "$red Sorry, there's no Amplify CLI binary installer available for this platform."
  exit 1
fi

# Detect architecture
MACHINE_TYPE=`uname -m`
if [[ $MACHINE_TYPE == "x86_64" ]]; then
  ARCH='x64'
else
  echo "$red Sorry, there's no Amplify CLI binary installer available for $MACHINE_TYPE architecture."
  exit 1
fi

if [[ -z "$version" ]]; then
  # if no version specified, look up the latest version
  version=`curl -L --silent https://api.github.com/repos/aws-amplify/amplify-cli/releases/latest 2>&1 | grep 'tag_name' | grep -oE "v[0-9]+\.[0-9]+\.[0-9]+(-[a-z]+\.[0-9]+)?"`
fi

BINARY_URL=https://github.com/aws-amplify/amplify-cli/releases/download/$version/amplify

# Dowload binary
BINARIES_DIR_PATH=$HOME/.amplify/bin
BINARY_PATH=$BINARIES_DIR_PATH/amplify
mkdir -p $BINARIES_DIR_PATH
printf "$yellow Downloading binary...$reset\n"

curl -L -o $BINARY_PATH $BINARY_URL
chmod +x $BINARY_PATH

# Create 'amp' alias
ln -sf amplify $BINARIES_DIR_PATH/amp

# Add to $PATH
SOURCE_STR="# Added by Amplify CLI binary installer\nexport PATH=\"\$HOME/.amplify/bin:\$PATH\"\n"
add_to_path () {
  command printf "\n$SOURCE_STR" >> "$1"
  printf "\n$yellow Added the following to $1:\n\n$SOURCE_STR$reset"
  source $1
}
SHELLTYPE="$(basename "/$SHELL")"
if [[ $SHELLTYPE = "fish" ]]; then
  command fish -c 'set -U fish_user_paths $fish_user_paths ~/.amplify/bin'
  printf "\n$yellow Added ~/.amplify/bin to fish_user_paths universal variable$reset."
elif [[ $SHELLTYPE = "zsh" ]]; then
  SHELL_CONFIG=$HOME/.zshrc
  if [ ! -r $SHELL_CONFIG ] || (! `grep -q '.amplify/bin' $SHELL_CONFIG`); then
    add_to_path $SHELL_CONFIG
  fi
else
  SHELL_CONFIG=$HOME/.bashrc
  if [ ! -r $SHELL_CONFIG ] || (! `grep -q '.amplify/bin' $SHELL_CONFIG`); then
    add_to_path $SHELL_CONFIG
  fi
  SHELL_CONFIG=$HOME/.bash_profile
  if [[ -r $SHELL_CONFIG ]]; then
    if [[ ! $(grep -q '.amplify/bin' $SHELL_CONFIG) ]]; then
      add_to_path $SHELL_CONFIG
    fi
  else
    SHELL_CONFIG=$HOME/.bash_login
    if [[ -r $SHELL_CONFIG ]]; then
      if [[ ! $(grep -q '.amplify/bin' $SHELL_CONFIG) ]]; then
        add_to_path $SHELL_CONFIG
      fi
    else
      SHELL_CONFIG=$HOME/.profile
      if [ ! -r $SHELL_CONFIG ] || (! `grep -q '.amplify/bin' $SHELL_CONFIG`); then
        add_to_path $SHELL_CONFIG
      fi
    fi
  fi
fi

$HOME/.amplify/bin/amplify post-install
printf "$green\nSuccessfully installed the Amplify CLI. Run 'amplify help' to get started!$reset\n"
