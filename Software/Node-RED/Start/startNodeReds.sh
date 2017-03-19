#!/bin/bash

# You don't actually need this, but its nice to have
die() {
    echo "$@" 1>&2
    exit 1
}

# List of all your settings
settings_files=( \
    "/home/a/.node-red/settings.js" \
    "/home/a/.node-red/settings2.js" \
)

# function to start node red plus extra output
# about whether or not that succeeded
launch_node_red() {
    settings_file="$1"
    echo "Starting node-red with settings file: $settings_file"
    node-red -s "$settings_file" || \
        die "Could not start node-red with $settings_file"
}

# for each of the settings files, start node red with
# that file and run it in the background
for settings_file in ${settings_files[@]}; do
    launch_node_red "$settings_file" &
done

# Comment this out if you want the current script to
# just return to the shell.
wait # for the servers to exit

#http://stackoverflow.com/questions/42880887/start-node-red-silent/42881129#42881129
