# USM CLI

## Overview

This is a command line tool that allows you to set up an auction using the metaplex metadata, vault, auction and auction manager programs. This parallels the process outlined in their web tool, but gives you more control from the command line.

## Installation

```
npm i -g usm-cli
```

## Usage

```
Usage: usm-cli [options] [command]

Options:
  -V, --version                                                   output the version number
  -h, --help                                                      display help for command

Commands:
  init-store [options]
  set-whitelist-creator [options] <store>
  create-vault [options]
  upload-image [options]
  create-metadata-uri [options]
  mint-nft [options] <uri>
  add-nft-to-vault [options] <nft> <vault>
  close-vault [options] <vault> <price_mint>
  init-auction [options] <vault>
  init-auction-manager [options] <vault>
  validate-auction-manager [options] <vault> <nft> <token_store>
  start-auction [options] <vault>
  end-auction [options] <vault>
  claim-bid [options] <vault>
  help [command]                                                  display help for command
```
