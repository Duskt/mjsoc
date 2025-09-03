#!/usr/bin/env sh
#
# This might look complicated, but most is just for making the .env file.
# Skip to the end of the file for the basic build and run commands. (Or see README.md)
#
# This shell script will:
# - check you have installed all the necessary dependencies
# - (if .env missing:) offer to interactively create a .env file
# - install npm/cargo dependencies
# - build the client js
# - build the server binaries
# - run the webserver

# todo: standardise working directory
# todo: compare to maketools autobuilder

# make shell stricter
set -euf 

err() {
	echo "Error: $*" >&2;
}

# bc i cba to resolve paths in shell script.
calldirectory=$(realpath "$(dirname "$0")")
if [ ! "$calldirectory" = "$PWD" ]; then 
    err "Please call me from the project root!"; exit 1;
fi

check_deps () {
	for d in "$@"; do
		# echo "Asserting $d is installed..."
		command -v "$d" >/dev/null 2>&1 || { err "Dependency $d must be installed to run this program."; exit 1; }
	done
}

# get yes / no input from user; returns via exit code
prompt_yn () {
	read -r REPLY;
	REPLY=$(echo "$REPLY" | tr "[:lower:]" "[:upper:]" | cut -c 1);
	test "$REPLY" = "Y";
}

# returns via global variable :(
get_admin_hash() {
	check_deps "argon2";
	printf "Enter admin password: ";
	read -r REPLY || exit 1;
	export ADMIN_PASSWORD_HASH;
	ADMIN_PASSWORD_HASH=$(echo "$REPLY" | argon2 saltItWithSalt -l 32 -e);
}

# returns via global variable and side effect :(
get_hmac_key() {
	HMAC_KEY_PATH="data/hmac.bin";
	printf "Enter path for HMAC key from server [%s]: " "$HMAC_KEY_PATH"; 
	read -r REPLY;
	if test -z "$REPLY"; then 
		if test ! -d server/data; then mkdir server/data; fi
	else HMAC_KEY_PATH="$REPLY";
	fi
	head -c 1000 /dev/random > "server/$HMAC_KEY_PATH" || exit 1;
}

assert_valid() {
    valid='[[:alpha:]_][[:alnum:]_]*$';
    if expr "$1" : "$valid" > /dev/null; then
	    eval "echo \"\${$1:-}\"";
    else err ".env.example contains an invalid key."; exit 1;
    fi
}

setup_env () {
	get_admin_hash;
	get_hmac_key;
	# get all the KEYS (key=value) in the .env.example file
	while read -r line; do
		key=$(echo "$line" | cut -f 1 -d "#" - | cut -f 1 -d "=" -);
		# see if we've overridden the example
		if test -n "$key" && value=$(assert_valid "$key"); then
			# append to .env either the new value or the example
			if test -n "$value"; then
				printf "%s=\"%s\"\n" "$key" "$value" >> server/.env;
			else echo "$line" >> server/.env;
			fi
		fi
	done < .env.example;
}

# compile-time dependencies (although cargo is a runtime depenency, and npm is needed to check runtime dependencies exist?)
check_deps "npm" "cargo" "esbuild";

# check for and setup .env
if [ ! -f server/.env ]; then
	echo ".env file has not been set up. You can either copy the '.env.example' file and follow the guided comments, or this script can set it up for you interactively.";
	printf "Use this script to configure '.env'? [Y/%sN%s]: " "$(tput smul)" "$(tput sgr0)";
	if prompt_yn; then
		setup_env;
		echo "Created .env file.";
		echo "Run this script again to compile and run the app.";
		exit 0;
	else err "Missing .env"; exit 1; 
	fi
fi

cd client || exit
npm run build # build the client js

cd ../server || exit 
cargo run --bin web # build and run the web server
