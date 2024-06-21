COMPILER = clang++
FLAGS = -O3

compile:
	$(COMPILER) $(FLAGS) main.cpp engine.cpp -o c4

run: compile
	./c4
