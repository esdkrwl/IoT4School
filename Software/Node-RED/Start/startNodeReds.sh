#!/bin/bash
# http://stackoverflow.com/questions/42880887/start-node-red-silent
# You don't actually need this, but its nice to have
die() {
    echo "$@" 1>&2
    exit 1
}

# List of all your settings
settings_files=( \
    "/home/a/.node-red/Gruppe_1/settings.js" \
	"/home/a/.node-red/Gruppe_2/settings.js" \
	"/home/a/.node-red/Gruppe_3/settings.js" \
	"/home/a/.node-red/Gruppe_4/settings.js" \
	"/home/a/.node-red/Gruppe_5/settings.js" \
)

flow_files=( \
    "/home/a/.node-red/Gruppe_1/flows.js" \
	"/home/a/.node-red/Gruppe_2/flows.js" \
	"/home/a/.node-red/Gruppe_3/flows.js" \
	"/home/a/.node-red/Gruppe_4/flows.js" \
	"/home/a/.node-red/Gruppe_5/flows.js" \
)

# function to start node red plus extra output
# about whether or not that succeeded
launch_node_red() {
    settings_file="$1"
	flow_file="$2"
    echo "Starting node-red with settings file: $settings_file and flow file: $flow_file"
    node-red -s "$settings_file" --flowFile "$flow_file" || \
        die "Could not start node-red with $settings_file"
}

# for each of the settings files, start node red with
# that file and run it in the background
i=0
while [ $i -lt ${#settings_files[*]} ]; do
	launch_node_red "${settings_files[$i]}" "${flow_files[$i]}" &
    i=$(( $i + 1));
done

# Comment this out if you want the current script to
# just return to the shell.
wait # for the servers to exit

#http://stackoverflow.com/questions/42880887/start-node-red-silent/42881129#42881129
