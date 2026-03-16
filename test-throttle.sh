#!/bin/bash

URL="http://localhost:3000/api/health"

# echo "--------------------------------"
# echo "Testing SHORT throttle (10 req / 1 sec)"
# echo "--------------------------------"

# for i in {1..20}
# do
#   status=$(curl -s -o /dev/null -w "%{http_code}" $URL)
#   echo "Request $i → $status"
# done

# sleep 3

# echo ""
# echo "--------------------------------"
# echo "Testing MEDIUM throttle (50 req / 10 sec)"
# echo "--------------------------------"

# for i in {1..70}
# do
#   status=$(curl -s -o /dev/null -w "%{http_code}" $URL)
#   echo "Request $i → $status"
# done

# sleep 12

echo ""
echo "--------------------------------"
echo "Testing LONG throttle (200 req / 60 sec)"
echo "--------------------------------"

for i in {1..250}
do
  status=$(curl -s -o /dev/null -w "%{http_code}" $URL)
  echo "Request $i → $status"
done

echo ""
echo "Done"