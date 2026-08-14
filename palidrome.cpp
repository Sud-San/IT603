#include<iostream>
#include<string.h>
using namespace std;

int main()
{
	char str[100],str1[100];
	int i,j;
	cout<<"Enter string:";
	cin>>str;

	for(i=0; str[i]!='\0'; i++);
	int n=i;
	for(j=0; j<n; j++)
	{
		str1[j]=str[--i];
	}

	if(strcmp(str,str1)==0)
	{
		cout<<"palindrome\n";
	}
	else
	{
		cout<<"Not palidrome\n";
	}
	
}
