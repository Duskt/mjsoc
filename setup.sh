#!/usr/bin/env sh
#
# This might look complicated, but most is just for making the .env file.
# Skip to the end of the file for the basic build and run commands. (Or see README.md)
#
# This shell script will:
# - check you have installed all the necessary dependencies
# - (if .env missing:) offer to interactively create a .env file

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
	HMAC_KEY_PATH="hmac.bin";
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
	# ignore admin hash for dev purposes: define via env var in release
	# get_admin_hash;
	get_hmac_key;
	# get all the KEYS (key=value) in the .env.example file
	while read -r line; do
		key=$(echo "$line" | cut -f 1 -d "#" - | cut -f 1 -d "=" -);
		# see if we've overridden the example
		if test -n "$key" && value=$(assert_valid "$key"); then
			# append to .env either the new value or the example
			if test -n "$value"; then
				printf "%s=\"%s\"\n" "$key" "$value" >> .env;
			else echo "$line" >> .env;
			fi
		fi
	done < .env.example;
}

# compile-time dependencies
check_deps "npm" "cargo";

# check for and setup .env
if [ ! -f .env ]; then 
	echo "Setting up .env file...";
	setup_env;
	echo "Created .env file.";
	echo "Call ./run.sh to compile and run the app.";
	exit 0;
else echo "Dependencies found. .env file already exists. Call ./run.sh to compile and run the app.";
fi
