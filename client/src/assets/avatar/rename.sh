#!/bin/bash

for file in face*; do
  mv "$file" "f-$file"
done
