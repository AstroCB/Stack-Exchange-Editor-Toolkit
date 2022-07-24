#!/usr/bin/python3
import sys
import re

words = {}
for line in re.split(r'[\|\n]',sys.stdin.read()):
	if (line):
		line = re.sub("^[ \t\"\+]*", '', line)
		line = re.sub("[ \t\"\+]*$", '', line)
		if (re.search(":",line)):
			(wrong, correct) = re.split(r':', line)
		else:
			correct = line
			wrong = correct
		correct = correct.strip()
		if (correct):
			if (correct not in words):
				words[correct] = {}
			for word in re.split(r',', wrong):
				word = word.strip()
				if (word and word != correct):
					words[correct][word] = 1

for ms in sorted(words.items(), key=lambda s:s[0].casefold()):
	rep = ",".join(sorted(ms[1], key=lambda s:s.casefold()))
	if (rep == ms[0] or len(rep)==0):
		mp = ms[0]
	else:
		mp = rep+ ":" + ms[0]
	print(mp)
