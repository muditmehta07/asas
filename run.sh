sudo apt install $(awk '{print $1}' ./packages.txt) -y
